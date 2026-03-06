from mudra.backend.models.account import Account

class SavingsAccount(Account):
    def __init__(self, owner_name, initial_balance, interest_rate):
        super().__init__(owner_name, initial_balance)

        if interest_rate < 0:
            raise ValueError("Interest rate cannot be negative")

        # FIX: consistent naming with underscore prefix (private attribute convention)
        self._interest_rate = interest_rate

    # FIX: all methods moved OUT of __init__ — now proper class-level methods
    def calculate_interest(self):
        return self._balance * self._interest_rate

    def apply_interest(self, category):
        interest = self.calculate_interest()
        self.deposit(interest, category, "Interest credited")

    def get_interest_rate(self):
        return self._interest_rate

    def __str__(self):
        return (
            f"SavingsAccount | {super().__str__()} | "
            f"Interest Rate: {self._interest_rate}"
        )