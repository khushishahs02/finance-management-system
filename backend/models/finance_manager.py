from datetime import datetime
import calendar
from dateutil.relativedelta import relativedelta
from mudra.backend.models.user import User
from mudra.backend.models.recurring_transaction import RecurringTransaction

class FinanceManager:

    def __init__(self):
        self._users = []

    # ── User management ──────────────────────────────────────
    def create_user(self, name):
        user = User(name)
        self._users.append(user)
        return user

    def find_user(self, user_id):
        for user in self._users:
            if user.get_user_id() == user_id:
                return user
        return None

    def get_users(self):
        return self._users

    # ── Transfer ─────────────────────────────────────────────
    def transfer(self, from_account, to_account, amount, category, description=""):
        if amount <= 0:
            raise ValueError("Transfer amount must be positive")
        from_account.withdraw(amount, category, description)
        to_account.deposit(amount, category, description)

    # ── Basic summaries ──────────────────────────────────────
    def get_total_balance(self, user_id):
        user = self.find_user(user_id)
        if user is None:
            raise ValueError("User not found")
        return sum(a.get_balance() for a in user.get_accounts())

    def get_category_expense_summary(self, user_id):
        user = self.find_user(user_id)
        if user is None:
            raise ValueError("User not found")

        summary = {}
        for account in user.get_accounts():
            for t in account.get_transactions():
                if t.get_type() == "withdraw":
                    name   = t.get_category().get_name()
                    amount = t.get_amount()
                    summary[name] = summary.get(name, 0) + amount
        return summary

    def get_income_expense_summary(self, user_id):
        user = self.find_user(user_id)
        if user is None:
            raise ValueError("User not found")

        total_income = 0
        total_expense = 0
        for account in user.get_accounts():
            for t in account.get_transactions():
                if t.get_type() == "deposit":
                    total_income += t.get_amount()
                elif t.get_type() == "withdraw":
                    total_expense += t.get_amount()
        return {"Income": total_income, "Expense": total_expense}

    # ────────────────────────────────────────────────────────
    # FEATURE 3: SMART BUDGET GUARDRAILS
    # ────────────────────────────────────────────────────────

    def check_budget_status(self, user_id, month, year):
        """
        For every budget the user set in the given month/year:
        1. Find actual amount spent in that category this month
        2. Calculate daily burn rate
        3. Project end-of-month spend
        4. Determine status: safe / warning / danger

        Returns a dict like:
        {
          "Food": {
            "limit":      5000,
            "spent":      2800,
            "projected":  7000,
            "risk":       2000,    # projected - limit (0 if under budget)
            "status":     "danger" # safe / warning / danger
          },
          ...
        }
        """
        user = self.find_user(user_id)
        if user is None:
            raise ValueError("User not found")

        today           = datetime.now()
        days_in_month   = calendar.monthrange(year, month)[1]  # 28/29/30/31
        days_passed     = today.day if (today.month == month and today.year == year) else days_in_month

        # Guard: avoid division by zero on the 1st day of month
        if days_passed == 0:
            days_passed = 1

        result = {}

        for budget in user.get_budgets():
            if budget.get_month() != month or budget.get_year() != year:
                continue

            category_name = budget.get_category().get_name()
            limit         = budget.get_monthly_limit()

            # Sum all withdrawals in this category for this month/year
            spent = 0.0
            for account in user.get_accounts():
                for t in account.get_transactions():
                    t_date = t.get_timestamp()
                    if (t.get_type() == "withdraw"
                            and t.get_category().get_name() == category_name
                            and t_date.month == month
                            and t_date.year == year):
                        spent += t.get_amount()

            # Core math for projection
            daily_burn_rate = spent / days_passed
            projected       = round(daily_burn_rate * days_in_month, 2)
            risk            = round(max(0, projected - limit), 2)

            # Status thresholds:
            # danger  → already over budget OR projected to exceed by >10%
            # warning → projected to exceed, but less than 10% over
            # safe    → projected to stay under budget
            percent_of_limit = (projected / limit) * 100 if limit > 0 else 0

            if spent > limit:
                status = "danger"
            elif percent_of_limit >= 110:
                status = "danger"
            elif percent_of_limit >= 85:
                status = "warning"
            else:
                status = "safe"

            result[category_name] = {
                "limit":     limit,
                "spent":     round(spent, 2),
                "projected": projected,
                "risk":      risk,
                "status":    status
            }

        return result

    # ────────────────────────────────────────────────────────
    # FEATURE 2: AFFORD IT — GOAL SIMULATOR
    # ────────────────────────────────────────────────────────

    def get_avg_monthly_savings(self, user_id, num_months=3):
        """
        Looks at the last `num_months` months of transactions.
        For each month: savings = income - expenses
        Returns the average monthly savings across those months.

        Real world: if last 3 months you saved ₹4000, ₹6000, ₹5000
        → avg = ₹5000/month. That's your saving power.
        """
        user = self.find_user(user_id)
        if user is None:
            raise ValueError("User not found")

        today = datetime.now()

        # Build list of (month, year) for last num_months months
        periods = []
        for i in range(num_months):
            d = today - relativedelta(months=i)
            periods.append((d.month, d.year))

        monthly_savings = []

        for (month, year) in periods:
            income  = 0.0
            expense = 0.0

            for account in user.get_accounts():
                for t in account.get_transactions():
                    t_date = t.get_timestamp()
                    if t_date.month == month and t_date.year == year:
                        if t.get_type() == "deposit":
                            income  += t.get_amount()
                        elif t.get_type() == "withdraw":
                            expense += t.get_amount()

            monthly_savings.append(income - expense)

        if not monthly_savings:
            return 0.0

        return round(sum(monthly_savings) / len(monthly_savings), 2)

    def get_goal_projection(self, user_id, goal_id):
        """
        Given a goal, calculates:
        - months needed to reach it at current savings rate
        - the estimated target date

        Returns:
        {
          "goal_name":             "Goa Trip",
          "target_amount":         30000,
          "already_saved":         5000,
          "remaining":             25000,
          "avg_monthly_savings":   5000,
          "months_to_goal":        5.0,
          "target_date":           "August 2025"
        }
        """
        user = self.find_user(user_id)
        if user is None:
            raise ValueError("User not found")

        goal = user.find_goal(goal_id)
        if goal is None:
            raise ValueError("Goal not found")

        avg_savings = self.get_avg_monthly_savings(user_id)

        if avg_savings <= 0:
            return {
                "goal_name":           goal.get_name(),
                "target_amount":       goal.get_target_amount(),
                "already_saved":       goal.get_current_saved(),
                "remaining":           goal.amount_remaining(),
                "avg_monthly_savings": avg_savings,
                "months_to_goal":      None,
                "target_date":         "Cannot project — you're not saving money currently"
            }

        remaining      = goal.amount_remaining()
        months_to_goal = round(remaining / avg_savings, 1)

        # Calculate the actual calendar date
        target_date = datetime.now() + relativedelta(months=int(months_to_goal))
        target_date_str = target_date.strftime("%B %Y")

        return {
            "goal_name":           goal.get_name(),
            "target_amount":       goal.get_target_amount(),
            "already_saved":       goal.get_current_saved(),
            "remaining":           round(remaining, 2),
            "avg_monthly_savings": avg_savings,
            "months_to_goal":      months_to_goal,
            "target_date":         target_date_str
        }

    def simulate_what_if(self, user_id, goal_id, category_name, cut_percent):
        """
        What if you cut spending in category X by Y%?
        Shows how much earlier you'd reach your goal.

        Example:
          cut_percent=30 on "Food" means "what if I spend 30% less on food?"

        Returns:
        {
          "original_months":    5.0,
          "original_date":      "August 2025",
          "monthly_saving_if_cut": 450.0,   ← how much you'd free up
          "new_monthly_savings":   5450.0,
          "new_months":            4.6,
          "new_date":              "July 2025",
          "months_saved":          0.4
        }
        """
        user = self.find_user(user_id)
        if user is None:
            raise ValueError("User not found")

        goal = user.find_goal(goal_id)
        if goal is None:
            raise ValueError("Goal not found")

        if not (0 < cut_percent <= 100):
            raise ValueError("cut_percent must be between 1 and 100")

        # Step 1: get baseline projection
        baseline = self.get_goal_projection(user_id, goal_id)

        if baseline["months_to_goal"] is None:
            return {"error": "Cannot simulate — no positive savings baseline"}

        avg_savings    = baseline["avg_monthly_savings"]
        remaining      = baseline["remaining"]

        # Step 2: calculate avg monthly spend in the chosen category (last 3 months)
        today   = datetime.now()
        periods = [(( today - relativedelta(months=i)).month,
                    ( today - relativedelta(months=i)).year)
                   for i in range(3)]

        category_spend_per_month = []
        for (month, year) in periods:
            month_spend = 0.0
            for account in user.get_accounts():
                for t in account.get_transactions():
                    t_date = t.get_timestamp()
                    if (t.get_type() == "withdraw"
                            and t.get_category().get_name() == category_name
                            and t_date.month == month
                            and t_date.year == year):
                        month_spend += t.get_amount()
            category_spend_per_month.append(month_spend)

        avg_category_spend = (sum(category_spend_per_month) / len(category_spend_per_month)
                              if category_spend_per_month else 0)

        # Step 3: how much would be freed up per month?
        monthly_freed  = round(avg_category_spend * (cut_percent / 100), 2)
        new_savings    = avg_savings + monthly_freed

        if new_savings <= 0:
            new_months = None
            new_date   = "Still cannot reach goal"
        else:
            new_months = round(remaining / new_savings, 1)
            new_date   = (datetime.now() + relativedelta(months=int(new_months))).strftime("%B %Y")

        return {
            "category_cut":          category_name,
            "cut_percent":           cut_percent,
            "original_months":       baseline["months_to_goal"],
            "original_date":         baseline["target_date"],
            "avg_category_spend":    round(avg_category_spend, 2),
            "monthly_saving_if_cut": monthly_freed,
            "new_monthly_savings":   round(new_savings, 2),
            "new_months":            new_months,
            "new_date":              new_date,
            "months_saved":          round(baseline["months_to_goal"] - (new_months or 0), 1)
        }

    def __str__(self):
        return f"FinanceManager | Total Users: {len(self._users)}"


    # ────────────────────────────────────────────────────────
    # RECURRING TRANSACTIONS
    # ────────────────────────────────────────────────────────

    def process_due_recurring(self, user_id, target_account_id):
        """
        Call this once a day (or on app startup).
        Finds all recurring rules due today → fires them as real transactions.

        target_account_id: which account to apply the transaction to.
        In a full app, each recurring rule would store its own account.
        For now, user picks one account for all recurring.

        Returns list of fired rule descriptions so UI can notify user:
        ["Salary ₹45000 deposited", "Netflix ₹999 withdrawn"]
        """
        user = self.find_user(user_id)
        if user is None:
            raise ValueError("User not found")

        account = user.find_account(target_account_id)
        if account is None:
            raise ValueError("Account not found")

        today   = datetime.now()
        fired   = []

        for rule in user.get_active_recurring():
            if rule.is_due(today):
                try:
                    if rule.get_type() == "deposit":
                        account.deposit(
                            rule.get_amount(),
                            rule.get_category(),
                            rule.get_description() or "Recurring deposit"
                        )
                    elif rule.get_type() == "withdraw":
                        account.withdraw(
                            rule.get_amount(),
                            rule.get_category(),
                            rule.get_description() or "Recurring withdrawal"
                        )

                    rule.mark_triggered()
                    fired.append(
                        f"{rule.get_description()} | "
                        f"{rule.get_type().upper()} ₹{rule.get_amount()}"
                    )

                except ValueError as e:
                    # e.g. insufficient balance for a recurring withdrawal
                    fired.append(
                        f"FAILED — {rule.get_description()}: {str(e)}"
                    )

        return fired

    # ────────────────────────────────────────────────────────
    # TRANSACTION HISTORY
    # ────────────────────────────────────────────────────────

    def get_monthly_history(self, user_id, month, year):
        """
        Returns ALL transactions for a user in a given month/year,
        sorted by timestamp (newest first).

        This is your "safe after 100 transactions" method.
        You can call get_monthly_history(user_id, 3, 2025) and get
        ONLY March 2025 — no matter how many total transactions exist.

        When DB is added in Phase 2, this becomes a single SQL query:
        SELECT * FROM transactions WHERE month=X AND year=Y
        The Python logic stays exactly the same — only the data source changes.

        Returns list of dicts (easier to display in UI later):
        [
          {
            "transaction_id": 1,
            "account_id":     1,
            "type":           "withdraw",
            "amount":         500.0,
            "category":       "Food",
            "description":    "Zomato order",
            "timestamp":      "2025-03-15 19:42:00"
          },
          ...
        ]
        """
        user = self.find_user(user_id)
        if user is None:
            raise ValueError("User not found")

        history = []

        for account in user.get_accounts():
            for t in account.get_transactions():
                t_date = t.get_timestamp()
                if t_date.month == month and t_date.year == year:
                    history.append({
                        "transaction_id": t.get_id(),
                        "account_id":     account.get_account_id(),
                        "type":           t.get_type(),
                        "amount":         t.get_amount(),
                        "category":       t.get_category().get_name(),
                        "description":    t._description,
                        "timestamp":      t_date.strftime("%Y-%m-%d %H:%M:%S")
                    })

        # Sort newest first
        history.sort(key=lambda x: x["timestamp"], reverse=True)
        return history

    def get_transaction_history_paginated(self, user_id, month, year,
                                          page=1, page_size=20):
        """
        Same as get_monthly_history but paginated.
        This is how real apps handle 100+ transactions without
        flooding the screen or crashing the UI.

        page=1, page_size=20 → first 20 transactions
        page=2, page_size=20 → next 20 transactions

        Connect to DSA: this is literally array slicing.
        start = (page - 1) * page_size  → start index
        end   = start + page_size       → end index
        result = full_list[start:end]

        Returns:
        {
          "page":        1,
          "page_size":   20,
          "total":       47,
          "total_pages": 3,
          "data":        [...] ← list of transaction dicts
        }
        """
        full_history = self.get_monthly_history(user_id, month, year)

        total       = len(full_history)
        total_pages = max(1, -(-total // page_size))  # ceiling division trick

        if page < 1 or page > total_pages:
            raise ValueError(f"Invalid page. Must be between 1 and {total_pages}")

        start  = (page - 1) * page_size
        end    = start + page_size
        sliced = full_history[start:end]

        return {
            "page":        page,
            "page_size":   page_size,
            "total":       total,
            "total_pages": total_pages,
            "data":        sliced
        }

    def get_available_months(self, user_id):
        """
        Returns all month/year combinations that have at least
        one transaction — for building a history dropdown in the UI.

        Returns: [{"month": 3, "year": 2025, "label": "March 2025"}, ...]
        sorted newest first.
        """
        user = self.find_user(user_id)
        if user is None:
            raise ValueError("User not found")

        seen    = set()
        periods = []

        for account in user.get_accounts():
            for t in account.get_transactions():
                key = (t.get_timestamp().month, t.get_timestamp().year)
                if key not in seen:
                    seen.add(key)
                    periods.append({
                        "month": key[0],
                        "year":  key[1],
                        "label": t.get_timestamp().strftime("%B %Y")
                    })

        periods.sort(key=lambda x: (x["year"], x["month"]), reverse=True)
        return periods