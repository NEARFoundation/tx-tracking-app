// Run via `yarn test backend/src/helpers/updateTransactions.test.ts`.

// https://jestjs.io/docs/setup-teardown#scoping
import mongoose, { type Mongoose } from 'mongoose';
import pg from 'pg';

import { subfolder } from '../../../shared/config.js';
import { type RowOfExpectedOutput, type TxActionRow, type AccountId } from '../../../shared/types';
import { getRowsOfExpectedOutput } from '../../data/csvToJson';
import { EXPECTED_OUTPUT_FILENAME } from '../../test_helpers/internal/defineTransactionHashesInSql';
import jsonToCsv from '../../test_helpers/internal/jsonToCsv';
import { seedTheMockIndexerDatabase } from '../../test_helpers/internal/updateTestData';
import { TxActions, convertFromModelToTxActionRow, cleanExpectedOutputFromCsv } from '../models/TxActions';
import { TxTypes } from '../models/TxTypes';

import { addTransactionTypeSqlToDatabase, DOT_SQL, getSqlFolder } from './addDefaultTypesTx';
import { CONNECTION_STRING, DEFAULT_LENGTH, MONGO_CONNECTION_STRING, STATEMENT_TIMEOUT } from './config';
import { updateTransactions } from './updateTransactions';

const prefix = '_tx_'; // This also gets used in the `t` script of `/package.json`.

// eslint-disable-next-line max-lines-per-function
describe('updateTransactions', () => {
  let connection: Mongoose;
  let sqlFolder: string;
  let pgClient: pg.Client;

  beforeAll(async () => {
    // Before any of this suite starts running, connect to Mongo, connect to PostgreSQL, seed the PostgreSQL test database, and close the PostgreSQL test database connection.
    connection = await mongoose.connect(MONGO_CONNECTION_STRING);
    sqlFolder = getSqlFolder(subfolder);
    const txTypesCountDocuments = await TxTypes.countDocuments();
    console.log({ txTypesCountDocuments, CONNECTION_STRING });
    await seedTheMockIndexerDatabase();
    pgClient = new pg.Client({ connectionString: CONNECTION_STRING, statement_timeout: STATEMENT_TIMEOUT });
    await pgClient.connect();
  });

  afterAll(async () => {
    // After all the tests of this suite finish, close the DB connection.
    await connection.disconnect();
    await pgClient.end();
  });

  beforeEach(async () => {
    // At the beginning of each test, clear out the Mongo database.
    await TxTypes.deleteMany({});
    await TxActions.deleteMany({});
  });

  jest.setTimeout(3_000);

  const rowsOfExpectedOutput: RowOfExpectedOutput[] = getRowsOfExpectedOutput(EXPECTED_OUTPUT_FILENAME);

  // console.log({ rowsOfExpectedOutput });

  function getRelevantRowsOfExpectedOutput(accountId: AccountId, txType: string) {
    return rowsOfExpectedOutput.filter((row) => row.accountId === accountId && row.txType === txType).map((row) => cleanExpectedOutputFromCsv(row));
  }

  async function runTest(accountId: AccountId, txType: string) {
    test(`${prefix} ${txType}`, async () => {
      const file = `${txType}${DOT_SQL}`;
      await addTransactionTypeSqlToDatabase(sqlFolder, file);
      await updateTransactions(pgClient, accountId, txType, DEFAULT_LENGTH);
      const txActions = await TxActions.find({
        accountId,
        txType,
      }).sort([['block_timestamp', -1]]);
      const txActionsConverted: TxActionRow[] = [];
      for (const txAction of txActions) {
        const txActionConverted = convertFromModelToTxActionRow(txAction);
        txActionsConverted.push(txActionConverted);
      }

      // console.log({ txActionsConverted });
      const relevantRowsOfExpectedOutput = getRelevantRowsOfExpectedOutput(accountId, txType);
      expect(txActionsConverted).toEqual(relevantRowsOfExpectedOutput.sort((a, b) => b.block_timestamp - a.block_timestamp));
    });
  }

  for (const rowOfExpectedOutput of rowsOfExpectedOutput) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { accountId, txType, transaction_hash } = rowOfExpectedOutput;
    if (txType) {
      runTest(accountId, txType)
        // eslint-disable-next-line promise/prefer-await-to-then
        .then((result) => {
          // console.log({ result });
        })
        // eslint-disable-next-line promise/prefer-await-to-then
        .catch((error) => {
          console.error({ error });
        });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      test(`${prefix} ${transaction_hash}`, () => {
        const hint = 'Where is the txType etc?'; // This test is kind of a fake test just to highlight within the test results (via test failure) that something unexpected is happening here. We don't actually expect transaction_hash to equal `hint`.
        expect(transaction_hash).toEqual(hint);
      });
    }
  }

  test('overwrite possibleExpectedOutput', async () => {
    const txActionsConverted: TxActionRow[] = [];
    for (const rowOfExpectedOutput of rowsOfExpectedOutput) {
      const { accountId, txType } = rowOfExpectedOutput;
      if (txType) {
        const file = `${txType}${DOT_SQL}`;
        await addTransactionTypeSqlToDatabase(sqlFolder, file);
        await updateTransactions(pgClient, accountId, txType, DEFAULT_LENGTH);
        const txActions = await TxActions.find({
          accountId,
          txType,
        }).sort([['block_timestamp', -1]]);

        for (const txAction of txActions) {
          const txActionConverted = convertFromModelToTxActionRow(txAction);
          txActionsConverted.push(txActionConverted);
        }
      }
    }

    // console.log('json', JSON.stringify(txActionsConverted, null, 2));
    jsonToCsv(txActionsConverted);
    console.log(
      "If you overwrite `expectedOutput.csv` via `cp backend/test_helpers/internal/possibleExpectedOutput.csv backend/test_helpers/expectedOutput.csv`, the tests will pass. Obviously, you'll need to manually check whether those values are accurate.",
    );
    expect(true).toEqual(true);
  });
});
