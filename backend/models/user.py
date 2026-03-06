from mudra.backend.models.savings_account import SavingsAccount
from mudra.backend.models.current_account import CurrentAccount
from mudra.backend.models.budget import Budget
from mudra.backend.models.goal import Goal

class User:
    _user_counter = 1

    def __init__(self, name):
        if not name:
            raise ValueError("User name cannot be empty")

        self._user_id   = User._user_counter
        User._user_counter += 1

        self._name      = name
        self._accounts  = []
        self._budgets   = []   # NEW: list of Budget objects
        self._goals     = []   # NEW: list of Goal objects

    # ── Getters ──────────────────────────────────────────────
    def get_user_id(self):
        return self._user_id

    def get_name(self):
        return self._name

    def get_accounts(self):
        return self._accounts

    def get_budgets(self):
        return self._budgets

    def get_goals(self):
        return self._goals

    # ── Account management ───────────────────────────────────
    def create_savings_account(self, initial_balance, interest_rate):
        account = SavingsAccount(self._name, initial_balance, interest_rate)
        self._accounts.append(account)
        return account

    def create_current_account(self, initial_balance, overdraft_limit):
        account = CurrentAccount(self._name, initial_balance, overdraft_limit)
        self._accounts.append(account)
        return account

    def find_account(self, account_id):
        for account in self._accounts:
            if account.get_account_id() == account_id:
                return account
        return None

    # ── Budget management ────────────────────────────────────
    def add_budget(self, category, monthly_limit, month, year):
        for b in self._budgets:
            if (b.get_category().get_name() == category.get_name()
                    and b.get_month() == month
                    and b.get_year() == year):
                raise ValueError(
                    f"Budget for '{category.get_name()}' in {month}/{year} already exists."
                )
        budget = Budget(category, monthly_limit, month, year)
        self._budgets.append(budget)
        return budget

    def find_budget(self, category_name, month, year):
        for b in self._budgets:
            if (b.get_category().get_name() == category_name
                    and b.get_month() == month
                    and b.get_year() == year):
                return b
        return None

    # ── Goal management ──────────────────────────────────────
    def add_goal(self, name, target_amount, initial_saved=0.0):
        goal = Goal(name, target_amount, initial_saved)
        self._goals.append(goal)
        return goal

    def find_goal(self, goal_id):
        for goal in self._goals:
            if goal.get_goal_id() == goal_id:
                return goal
        return None

    def get_active_goals(self):
        return [g for g in self._goals if not g.is_achieved()]

    # ── Display ──────────────────────────────────────────────
    def __str__(self):
        return (
            f"User ID: {self._user_id} | "
            f"Name: {self._name} | "
            f"Accounts: {len(self._accounts)} | "
            f"Budgets: {len(self._budgets)} | "
            f"Goals: {len(self._goals)}"
        )