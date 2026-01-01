const monthPicker = document.getElementById("month-picker");
const showReportBtn = document.getElementById("show-report");
const chartCanvas = document.getElementById("expenseChart");

let expenseChart = null;
const budgetInput = document.getElementById("budget-input");
const setBudgetBtn = document.getElementById("set-budget");
const remainingBudgetEl = document.getElementById("remaining-budget");
const budgetWarning = document.getElementById("budget-warning");

let monthlyBudget = Number(localStorage.getItem("monthlyBudget")) || 0;

const form = document.getElementById("expense-form");
const expenseList = document.getElementById("expense-list");
const totalEl = document.getElementById("total");
const filterCategory = document.getElementById("filter-category");

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let editId = null;

// Add or Update Expense
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const amount = Number(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value;

  if (editId) {
    expenses = expenses.map(exp =>
      exp.id === editId ? { ...exp, title, amount, category, date } : exp
    );
    editId = null;
  } else {
    expenses.push({
      id: Date.now(),
      title,
      amount,
      category,
      date
    });
  }

  localStorage.setItem("expenses", JSON.stringify(expenses));
  form.reset();
  renderExpenses();
});

// Event Delegation for Edit/Delete
expenseList.addEventListener("click", function (e) {
  const id = Number(e.target.dataset.id);

  if (e.target.classList.contains("delete")) {
    expenses = expenses.filter(exp => exp.id !== id);
  }

  if (e.target.classList.contains("edit")) {
    const exp = expenses.find(exp => exp.id === id);
    document.getElementById("title").value = exp.title;
    document.getElementById("amount").value = exp.amount;
    document.getElementById("category").value = exp.category;
    document.getElementById("date").value = exp.date;
    editId = id;
  }

  localStorage.setItem("expenses", JSON.stringify(expenses));
  renderExpenses();
});

// Filter
filterCategory.addEventListener("change", renderExpenses);

// Render Expenses
function renderExpenses() {
  expenseList.innerHTML = "";

  const filteredExpenses = filterCategory.value === "All"
    ? expenses
    : expenses.filter(exp => exp.category === filterCategory.value);

  filteredExpenses.forEach(exp => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${exp.title}</td>
      <td>₹${exp.amount}</td>
      <td>${exp.category}</td>
      <td>${exp.date}</td>
      <td>
        <button class="edit" data-id="${exp.id}">Edit</button>
        <button class="delete" data-id="${exp.id}">Delete</button>
      </td>
    `;

    expenseList.appendChild(tr);
  });

  updateTotal(filteredExpenses);
}

// Calculate Total
function updateTotal(data) {
  const total = data.reduce((sum, exp) => sum + exp.amount, 0);
  totalEl.textContent = total;
}

// Initial Load
showReportBtn.addEventListener("click", generateMonthlyReport);

function generateMonthlyReport() {
  if (!monthPicker.value) {
    alert("Please select a month");
    return;
  }

  const selectedMonth = monthPicker.value;
  const monthlyExpenses = expenses.filter(exp =>
    exp.date.startsWith(selectedMonth)
  );

  if (!monthlyExpenses.length) {
    alert("No expenses found for this month");
    return;
  }

  const categoryTotals = {};
  monthlyExpenses.forEach(exp => {
    categoryTotals[exp.category] =
      (categoryTotals[exp.category] || 0) + exp.amount;
  });

  renderPieChart(
    Object.keys(categoryTotals),
    Object.values(categoryTotals)
  );
}
function renderPieChart(labels, data) {
  if (expenseChart) {
    expenseChart.destroy(); // prevent duplicate charts
  }

  expenseChart = new Chart(chartCanvas, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: [
          "#ff6384",
          "#36a2eb",
          "#ffce56",
          "#4bc0c0",
          "#9966ff"
        ]
      }]
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const value = context.raw;
              const percentage = ((value / total) * 100).toFixed(2);
              return `${context.label}: ₹${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}
setBudgetBtn.addEventListener("click", function () {
  const value = Number(budgetInput.value);

  if (value <= 0) {
    alert("Please enter a valid budget");
    return;
  }

  monthlyBudget = value;
  localStorage.setItem("monthlyBudget", monthlyBudget);

  budgetInput.value = "";
  updateRemainingBudget();
});
function getCurrentMonthTotal() {
  const currentMonth = new Date().toISOString().slice(0, 7);

  return expenses
    .filter(exp => exp.date.startsWith(currentMonth))
    .reduce((sum, exp) => sum + exp.amount, 0);
}
function updateRemainingBudget() {
  if (!monthlyBudget) return;

  const spent = getCurrentMonthTotal();
  const remaining = monthlyBudget - spent;

  remainingBudgetEl.textContent = remaining >= 0 ? remaining : 0;

  if (remaining < 0) {
    budgetWarning.textContent = "⚠ Budget exceeded!";
    alert("You have exceeded your monthly budget!");
  } else if (remaining < monthlyBudget * 0.2) {
    budgetWarning.textContent = "⚠ Approaching budget limit!";
  } else {
    budgetWarning.textContent = "";
  }
}

// ===== INITIAL LOAD =====
remainingBudgetEl.textContent = monthlyBudget;
renderExpenses();


