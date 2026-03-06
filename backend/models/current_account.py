from mudra.backend.models.account import Account
from mudra.backend.models.transaction import Transaction

class CurrentAccount(Account) :
    def __init__(self, owner_name, initial_balance, overdraft_limit) :
        super().__init__(owner_name, initial_balance)
    
        if overdraft_limit < 0:
              raise ValueError("Overdraft limit cannot be negative")
        self._overdraft_limit = overdraft_limit
    
    def withdraw(self, amount, category, description=""):
         if amount <= 0:
           raise ValueError("Withdrawal amount must be positive")

         if amount > self._balance + self._overdraft_limit:
          raise ValueError("Overdraft limit exceeded")

         self._balance -= amount

         transaction = Transaction("withdraw", amount, category, description)
         self._transactions.append(transaction)

    def calculate_interest(self):
         return 0
    
    def __str__(self):
      return (
        f"CurrentAccount | {super().__str__()} | "
        f"Overdraft Limit: {self._overdraft_limit}"
    )