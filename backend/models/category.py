class Category :
    _category_counter = 1
    def __init__(self, name, category_type) :
       if not name :
           raise ValueError("Category cannot be empty")
       
       if category_type.lower() not in ["income", "expense" ]:
           raise ValueError("Category type must be 'income' or 'expense' ")
       
       self._category_id = Category._category_counter
       Category._category_counter += 1

       self._name = name
       self._type = category_type.lower()
    def get_id(self):
      return self._category_id

    def get_name(self):
      return self._name

    def get_type(self):
      return self._type
    
    def __str__(self):
      return f"[Category ID: {self._category_id}] {self._name} ({self._type})"