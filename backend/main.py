import matplotlib.pyplot as plt
from mudra.backend.models.transaction import Transaction   # FIX: correct Python import syntax

# NOTE: finance_manager and user_id need to be set up before this runs.
# This is a placeholder — we'll replace this with FastAPI + frontend later.

summary = finance_manager.get_income_expense_summary(user_id)
labels = list(summary.keys())
values = list(summary.values())

plt.bar(labels, values)
plt.title("Income vs Expense Summary")
plt.xlabel("Type")
plt.ylabel("Amount")
plt.show()