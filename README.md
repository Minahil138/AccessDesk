# AccessDesk — Assignment 05

Role-Based Customer Access Portal for Full Stack Web Development.

## Requirements
- Node.js and npm
- XAMPP with MySQL running
- Lecture database `mydb8` and table `customers4`
- Table columns must be named `Name` and `Address`

## Run steps (Windows)
1. Start **MySQL** from the XAMPP Control Panel.
2. Open phpMyAdmin at `http://localhost/phpmyadmin`.
3. Confirm `mydb8.customers4` exists and has `Name` and `Address` columns. If it does not exist, select the SQL tab and run `database.sql`. If your lecture table already exists with data, do not overwrite it; just check the column names.
4. Open Command Prompt in the `AccessDesk` project folder.
5. Install dependencies:
   ```cmd
   npm install
   ```
6. Start the API:
   ```cmd
   npm start
   ```
7. Open `http://localhost:3000` in your browser.

## Demo API keys
| Role | Demo key | Max rows | Starting credits | Actions |
|---|---|---:|---:|---|
| Guest | `guest-demo-key` | 2 | 4 | Load |
| Student | `student-demo-key` | 3 | 8 | Load + Search |
| Teacher | `teacher-demo-key` | 10 | 30 | Load + Search |
| Admin | `admin-demo-key` | 20 | 50 | Load + Search + Usage |

These are classroom demo keys, not production secrets. Choose a role in the page to populate its key. You can also edit the API key field to test an unknown key.

## API routes
- `GET /api/customers?limit=10` — Load records within role row limits.
- `GET /api/customers/search?name=Ali` — Search by name. Guest is denied.
- `GET /api/access/summary` — Admin-only remaining-credit summary.
- `GET /api/health` — Health check.

Every request must include `x-api-key`. Each successful customer load/search uses one credit. Usage summary does not consume a customer credit. Credits are kept in memory and reset when Node.js restarts.

## Verification checklist
1. Unknown key: enter `wrong-key` and load — expect HTTP 401.
2. Guest load 10: select Guest and load — expect at most 2 records and **Name only**.
3. Guest search: select Guest and search — expect HTTP 403.
4. Student load 10: expect at most 3 records.
5. Teacher load 10: expect at most 10 records.
6. Student exhausted credits: restart Node.js; select Student and make 8 successful customer requests. The next customer request should return HTTP 429. (Do this test separately from other Student testing.)
7. Non-admin usage: select Student and click View Usage — expect HTTP 403.
8. Admin usage: select Admin and click View Usage — expect remaining credits for each role, without API keys or database credentials.

## Screenshots to include in submission
Take screenshots of:
- Role selection / normal results
- Search results
- A visible HTTP 403 response (Guest search or Student usage)
- A visible HTTP 429 response after credits are exhausted

## Notes
- The API uses parameterized SQL for the search value and row limit.
- Customer responses include role, allowed row count, and remaining credits.
- Guest addresses are removed in the server response; CSS is not used to hide them.
- The server serves the jQuery frontend from the same origin, avoiding a CORS issue in this setup.
- If your lecture table uses different column names or lowercase column names, update the SQL column names in `server.js` to match your actual table.
- Database settings are in `server.js` for the default XAMPP configuration (`root`, empty password). Adjust them if your local MySQL setup differs.
