from datetime import datetime
from mudra.backend.models.category import Category

class RecurringTransaction:
    """
    Stores a RULE, not an actual transaction.
    Think of it like a standing instruction at your bank:
    "Every month on day 1, credit ₹45,000 as Salary."

    When FinanceManager.process_due_recurring() runs,
    it reads these rules and fires real Transaction objects.
    """

    VALID_FREQUENCIES = ["monthly", "weekly", "daily"]

    _counter = 1

    def __init__(self, transaction_type, amount, category,
                 frequency, day_of_month, description=""):
        """
        transaction_type : "deposit" or "withdraw"
        amount           : float
        category         : Category object
        frequency        : "monthly" / "weekly" / "daily"
        day_of_month     : int 1-28  (we cap at 28 to avoid Feb issues)
                           e.g. 1 = fires on 1st of every month
        description      : e.g. "HDFC Salary", "Netflix Sub", "House Rent"
        """
        if not isinstance(category, Category):
            raise TypeError("category must be a Category object")

        if amount <= 0:
            raise ValueError("Amount must be positive")

        if transaction_type.lower() not in ["deposit", "withdraw"]:
            raise ValueError("Type must be 'deposit' or 'withdraw'")

        if frequency.lower() not in self.VALID_FREQUENCIES:
            raise ValueError(f"Frequency must be one of {self.VALID_FREQUENCIES}")

        if not (1 <= day_of_month <= 28):
            raise ValueError("day_of_month must be 1–28 (capped at 28 to handle all months safely)")

        self._id             = RecurringTransaction._counter
        RecurringTransaction._counter += 1

        self._type           = transaction_type.lower()
        self._amount         = amount
        self._category       = category
        self._frequency      = frequency.lower()
        self._day_of_month   = day_of_month
        self._description    = description
        self._created_date   = datetime.now()
        self._last_triggered = None   # None means never fired yet
        self._is_active      = True   # can pause without deleting

    # ── Getters ──────────────────────────────────────────────
    def get_id(self):
        return self._id

    def get_type(self):
        return self._type

    def get_amount(self):
        return self._amount

    def get_category(self):
        return self._category

    def get_frequency(self):
        return self._frequency

    def get_day_of_month(self):
        return self._day_of_month

    def get_description(self):
        return self._description

    def get_last_triggered(self):
        return self._last_triggered

    def is_active(self):
        return self._is_active

    # ── Control ───────────────────────────────────────────────
    def pause(self):
        """Pause without deleting — e.g. Netflix cancelled for now."""
        self._is_active = False

    def resume(self):
        self._is_active = True

    # ── Core logic: is this rule due today? ──────────────────
    def is_due(self, today=None):
        """
        Returns True if this recurring rule should fire today.

        Logic for monthly frequency:
          - today's day matches day_of_month
          - AND it hasn't already been triggered this month/year

        This prevents double-firing if process_due_recurring()
        is called multiple times on the same day.
        """
        if not self._is_active:
            return False

        if today is None:
            today = datetime.now()

        if self._frequency == "monthly":
            if today.day != self._day_of_month:
                return False

            # Already triggered this month?
            if self._last_triggered is not None:
                if (self._last_triggered.month == today.month and
                        self._last_triggered.year == today.year):
                    return False

            return True

        elif self._frequency == "weekly":
            # day_of_month repurposed as day_of_week (0=Mon, 6=Sun)
            if today.weekday() != self._day_of_month % 7:
                return False

            if self._last_triggered is not None:
                days_since = (today - self._last_triggered).days
                if days_since < 7:
                    return False
            return True

        elif self._frequency == "daily":
            if self._last_triggered is not None:
                if self._last_triggered.date() == today.date():
                    return False
            return True

        return False

    def mark_triggered(self):
        """Called by FinanceManager after it successfully fires this rule."""
        self._last_triggered = datetime.now()

    def __str__(self):
        status = "ACTIVE" if self._is_active else "PAUSED"
        last   = self._last_triggered.strftime("%Y-%m-%d") if self._last_triggered else "Never"
        return (
            f"[Recurring ID: {self._id}] "
            f"{self._type.upper()} ₹{self._amount} | "
            f"Category: {self._category.get_name()} | "
            f"Every {self._frequency} on day {self._day_of_month} | "
            f"Last fired: {last} | {status}"
        )