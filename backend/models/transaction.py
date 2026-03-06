from datetime import datetime
from mudra.backend.models.category import Category


class Transaction :
    _transaction_counter = 1 #class variable

    def __init__ (self, transaction_type, amount, category , description = "" ) :
        if amount <= 0 :
            raise ValueError ("Transaction must be positive")
        if not isinstance(category, Category):
         raise TypeError("category must be a Category object")
        self.__transaction_id = Transaction._transaction_counter
        Transaction._transaction_counter += 1
        
        if transaction_type.lower() not in ["deposit", "withdraw", "transfer"]:
           raise ValueError("Invalid transaction type")
        self._type = transaction_type
        self._amount = amount
        self._timestamp = datetime.now()
        self._category = category
        self._description = description #private attributes accessed via getter methods

    def get_id(self) :
        return self.__transaction_id
    
    def get_type(self):
        return self._type

    def get_amount(self):
        return self._amount

    def get_timestamp(self):
        return self._timestamp

    def get_category(self):
        return self._category
    
    def __str__(self):
        return (
            f"[Transaction ID: {self.__transaction_id}] "
            f"{self._type.upper()} | "
            f"Amount: {self._amount} | "
            f"Category: {self._category.get_name()} | "
            f"Time: {self._timestamp.strftime('%Y-%m-%d %H:%M:%S')}"
        
        )


