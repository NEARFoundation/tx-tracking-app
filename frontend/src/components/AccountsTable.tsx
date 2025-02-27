import { AccountId, AccountsTableProps, AccountStatus } from '../../../shared/types';
import { ALLOW_DELETING_FROM_DATABASE } from '../helpers/config';
import { handleExportCsv } from '../helpers/csv';

import AccountRow from './AccountRow';

function getAccountStatus(accountStatuses: AccountStatus[], accountId: AccountId): AccountStatus | null {
  console.log({ accountStatuses });
  if (accountStatuses.length > 0) {
    const result = accountStatuses.find((item: AccountStatus) => {
      return item.accountId === accountId;
    });
    return result ? result : null;
  }

  return null;
}

const sometimesEmptyHeader = ALLOW_DELETING_FROM_DATABASE ? <th></th> : <></>;
const csvDownloadButtonColSpan = ALLOW_DELETING_FROM_DATABASE ? 4 : 3;

function AddNewAccountForm({ addNewAccount, handleNewAccountIdInputChange, newAccountId, exampleAccount, buttonText = 'Add' }) {
  return (
    <form onSubmit={addNewAccount}>
      <input type="text" onChange={handleNewAccountIdInputChange} value={newAccountId} placeholder={exampleAccount} />
      <button type="submit" title="Add new account" className="silverBtn">
        {buttonText}
      </button>
    </form>
  );
}

function moveToFirst(stringToMove: string, array: string[]) {
  // https://stackoverflow.com/a/53913914/
  if (array.includes(stringToMove)) {
    const currentIndex = array.indexOf(stringToMove);
    array.splice(currentIndex, 1);
    array.unshift(stringToMove);
  }
}

// eslint-disable-next-line max-lines-per-function
export function AccountsTable({
  accountIds,
  setAccountIds,
  accountStatuses,
  handleNewAccountIdInputChange,
  addNewAccount,
  exampleAccount,
  selectedAccountIdsForCsv,
  setSelectedAccountIdsForCsv,
  messageCsv,
  csvTransactions,
  newAccountId,
  startDate,
  endDate,
  getTransactions,
  runTaskForThisAccount,
  selectedAccountId,
}: AccountsTableProps) {
  accountIds.sort();
  moveToFirst(selectedAccountId, accountIds);
  // console.log({ accountIds });

  function deleteFromLocalStorage(accountIdToDelete: AccountId) {
    const newAccountIDs = accountIds.filter((item: any) => item !== accountIdToDelete);
    console.log('deleteFromLocalStorage', accountIdToDelete, newAccountIDs);
    setAccountIds(newAccountIDs);
  }

  const addAccountCsv = (event: any) => {
    const { value, checked } = event.target;
    setSelectedAccountIdsForCsv([...selectedAccountIdsForCsv, value]);
    if (!checked) {
      setSelectedAccountIdsForCsv(selectedAccountIdsForCsv.filter((item: any) => item !== value));
    }
  };

  const handleSelectAll = (event: any) => {
    const { checked } = event.target;
    if (checked) {
      setSelectedAccountIdsForCsv(accountIds);
    } else {
      setSelectedAccountIdsForCsv([]);
    }
  };

  const basePropsForAddNewAccountForm = { addNewAccount, handleNewAccountIdInputChange, exampleAccount, newAccountId };
  return (
    <div style={{ textAlign: 'center' }}>
      {accountIds.length > 0 ? (
        <>
          <table className="accountsTable">
            <thead>
              <tr>
                <th>Account ID</th>
                <th>Status</th>
                <th>Last Update</th>
                <th></th>
                <th>
                  <input type="checkbox" onChange={handleSelectAll} />
                </th>
                {sometimesEmptyHeader}
              </tr>
            </thead>
            <tbody>
              {accountIds.map((accountIdForRow: AccountId, index: number) => {
                const accountStatus = getAccountStatus(accountStatuses, accountIdForRow);
                return (
                  <AccountRow
                    {...{
                      accountId: accountIdForRow,
                      deleteFromLocalStorage,
                      accountStatus,
                      getTransactions,
                      runTaskForThisAccount,
                      selectedAccountId,
                      selectedAccountIdsForCsv,
                      addAccountCsv,
                    }}
                    key={index}
                  />
                );
              })}
              <tr key="addAccountId">
                <td colSpan={2} className="max-width-none">
                  <AddNewAccountForm {...{ ...basePropsForAddNewAccountForm, buttonText: '+' }} />
                </td>
                <td colSpan={csvDownloadButtonColSpan} style={{ textAlign: 'right' }}>
                  {csvTransactions.length > 0 ? (
                    <button
                      className="downloadBtn"
                      onClick={() => {
                        handleExportCsv(csvTransactions, startDate, endDate, accountIds);
                      }}
                    >
                      Download as CSV
                    </button>
                  ) : (
                    messageCsv
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </>
      ) : (
        <>
          <p>Enter the account ID:</p>
          <AddNewAccountForm {...basePropsForAddNewAccountForm} />
        </>
      )}
    </div>
  );
}
