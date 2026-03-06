from mudra.backend.models.category import Category

class Budget:
    _budget_counter = 1

    def __init__(self, category, monthly_limit, month, year):
        """
        category      : Category object (e.g. Food, Transport)
        monthly_limit : max you're allowed to spend this month in that category
        month         : int 1-12
        year          : int e.g. 2025
        """
        if not isinstance(category, Category):
            raise TypeError("category must be a Category object")

        if monthly_limit <= 0:
            raise ValueError("Monthly limit must be positive")

        if not (1 <= month <= 12):
            raise ValueError("Month must be between 1 and 12")

        if year < 2000:
            raise ValueError("Year seems invalid")

        self._budget_id    = Budget._budget_counter
        Budget._budget_counter += 1

        self._category      = category
        self._monthly_limit = monthly_limit
        self._month         = month
        self._year          = year

    # ── Getters ──────────────────────────────────────────────
    def get_budget_id(self):
        return self._budget_id

    def get_category(self):
        return self._category

    def get_monthly_limit(self):
        return self._monthly_limit

    def get_month(self):
        return self._month

    def get_year(self):
        return self._year

    def update_limit(self, new_limit):
        """Allow user to revise budget mid-month."""
        if new_limit <= 0:
            raise ValueError("New limit must be positive")
        self._monthly_limit = new_limit

    def __str__(self):
        return (
            f"[Budget ID: {self._budget_id}] "
            f"Category: {self._category.get_name()} | "
            f"Limit: {self._monthly_limit} | "
            f"Period: {self._month}/{self._year}"
        )