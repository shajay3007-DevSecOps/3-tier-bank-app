CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00
);

INSERT INTO accounts (name, account_number, balance) VALUES
('John Doe', 'ACCT-1001', 5420.50),
('Jane Smith', 'ACCT-1002', 12850.00)
ON CONFLICT (account_number) DO NOTHING;
