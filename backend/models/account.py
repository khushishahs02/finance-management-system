from abc import ABC, abstractmethod
from mudra.backend.models.transaction import Transaction

class Account(ABC):
    _account_counter = 1

    def __init__(self, owner_name, initial_balance):
        if initial_balance < 0:
            raise ValueError("Initial balance cannot be negative")

        self._account_id = Account._account_counter
        Account._account_counter += 1

        self._owner_name = owner_name
        self._balance = initial_balance
        self._transactions = []

    def get_account_id(self):
        return self._account_id

    def get_owner_name(self):
        return self._owner_name

    def get_balance(self):
        return self._balance

    def get_transactions(self):
        return self._transactions

    def deposit(self, amount, category, description=""):
        if amount <= 0:
            raise ValueError("Deposit amount must be positive")

        self._balance += amount

        transaction = Transaction("deposit", amount, category, description)
        self._transactions.append(transaction)

    def withdraw(self, amount, category, description=""):
        if amount <= 0:
            raise ValueError("Withdrawal amount must be positive")

        if amount > self._balance:
            raise ValueError("Insufficient balance")

        self._balance -= amount

        transaction = Transaction("withdraw", amount, category, description)
        self._transactions.append(transaction)

    # FIX: moved OUT of withdraw() — now properly a class-level abstract method
    @abstractmethod
    def calculate_interest(self):
        pass

    # FIX: moved OUT of withdraw() — now properly a class-level method
    def __str__(self):
        return (
            f"Account ID: {self._account_id} | "
            f"Owner: {self._owner_name} | "
            f"Balance: {self._balance}"
        )