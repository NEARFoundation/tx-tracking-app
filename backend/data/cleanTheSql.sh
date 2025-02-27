# This file gets run automatically from within `backend/test_helpers/updateTestData.sh`
# Or run manually via `SQL_FILE=backend/test_helpers/internal/testData.sql ./backend/data/cleanTheSql.sh`

# Note that many lines below needed to have operations split into multiple lines (using placeholder files rather than operating on the file directly) due to Mac security rules.


DB_PREFIX='public.'
TBL_PREFIX='temp_test_export_'
PLACEHOLDER_FILE=$SQL_FILE.new


# https://stackoverflow.com/a/525612/
echo "Deleting $TBL_PREFIX from the insert statements..."
sed -i '' "s/$TBL_PREFIX//g" $SQL_FILE

echo "Deleting $DB_PREFIX from the SQL..."
sed -i '' "s/$DB_PREFIX//g" $SQL_FILE

# --------------------------------------------------------
echo "Removing certain unimportant lines from the SQL..."

sed '/^ALTER TABLE / d' $SQL_FILE > $PLACEHOLDER_FILE
rm $SQL_FILE
mv $PLACEHOLDER_FILE $SQL_FILE

sed '/^SET / d' $SQL_FILE > $PLACEHOLDER_FILE
rm $SQL_FILE
mv $PLACEHOLDER_FILE $SQL_FILE

sed '/^SELECT / d' $SQL_FILE > $PLACEHOLDER_FILE
rm $SQL_FILE
mv $PLACEHOLDER_FILE $SQL_FILE

sed '/^--/ d' $SQL_FILE > $PLACEHOLDER_FILE
rm $SQL_FILE
mv $PLACEHOLDER_FILE $SQL_FILE

# --------------------------------------------------------
# Consolidate empty lines (https://unix.stackexchange.com/a/131228/):
sed -e '/./b' -e :n -e 'N;s/\n$//;tn' $SQL_FILE > $PLACEHOLDER_FILE
rm $SQL_FILE
mv $PLACEHOLDER_FILE $SQL_FILE

# --------------------------------------------------------
# Mark the enums as text. (Is there a better way to handle these?)
sed 's/action_kind action_kind/action_kind text/g' $SQL_FILE > $PLACEHOLDER_FILE
rm $SQL_FILE
mv $PLACEHOLDER_FILE $SQL_FILE

sed 's/status execution_outcome_status/status text/g' $SQL_FILE > $PLACEHOLDER_FILE
rm $SQL_FILE
mv $PLACEHOLDER_FILE $SQL_FILE

sed 's/receipt_kind receipt_kind/receipt_kind text/g' $SQL_FILE > $PLACEHOLDER_FILE
rm $SQL_FILE
mv $PLACEHOLDER_FILE $SQL_FILE
# --------------------------------------------------------

# Find each instance of "CREATE TABLE" and ensure that "DROP TABLE IF EXISTS" gets called beforehand. https://stackoverflow.com/a/30431410/
sed -E 's/CREATE TABLE (.+) /DROP TABLE IF EXISTS \1; CREATE TABLE \1 /g' $SQL_FILE > $PLACEHOLDER_FILE
rm $SQL_FILE
mv $PLACEHOLDER_FILE $SQL_FILE

echo "cleanTheSql.sh finished."