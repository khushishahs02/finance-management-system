from datetime import datetime

class Goal:
    _goal_counter = 1

    def __init__(self, name, target_amount, initial_saved=0.0):
        """
        name           : string e.g. "Goa Trip", "New Laptop"
        target_amount  : float  e.g. 30000.0
        initial_saved  : float  if user already has some money set aside
        """
        if not name:
            raise ValueError("Goal name cannot be empty")

        if target_amount <= 0:
            raise ValueError("Target amount must be positive")

        if initial_saved < 0:
            raise ValueError("Initial saved amount cannot be negative")

        if initial_saved > target_amount:
            raise ValueError("Already saved more than the target — goal is already met!")

        self._goal_id       = Goal._goal_counter
        Goal._goal_counter += 1

        self._name           = name
        self._target_amount  = target_amount
        self._current_saved  = initial_saved
        self._created_date   = datetime.now()
        self._is_achieved    = False

    # ── Getters ──────────────────────────────────────────────
    def get_goal_id(self):
        return self._goal_id

    def get_name(self):
        return self._name

    def get_target_amount(self):
        return self._target_amount

    def get_current_saved(self):
        return self._current_saved

    def get_created_date(self):
        return self._created_date

    def is_achieved(self):
        return self._is_achieved

    # ── Core logic ───────────────────────────────────────────
    def add_savings(self, amount):
        """
        Call this whenever user manually allocates money toward this goal.
        Real world: "I'm putting this month's ₹2000 bonus toward my Goa trip."
        """
        if amount <= 0:
            raise ValueError("Amount must be positive")

        self._current_saved += amount

        # auto-mark achieved once target is hit
        if self._current_saved >= self._target_amount:
            self._current_saved = self._target_amount  # cap it, no overflow
            self._is_achieved   = True

    def progress_percent(self):
        """Returns 0.0 to 100.0 — how close you are to the goal."""
        return round((self._current_saved / self._target_amount) * 100, 2)

    def amount_remaining(self):
        """How much more you still need."""
        return self._target_amount - self._current_saved

    def __str__(self):
        status = "✅ ACHIEVED" if self._is_achieved else f"{self.progress_percent()}% done"
        return (
            f"[Goal ID: {self._goal_id}] "
            f"{self._name} | "
            f"Target: {self._target_amount} | "
            f"Saved: {self._current_saved} | "
            f"Status: {status}"
        )