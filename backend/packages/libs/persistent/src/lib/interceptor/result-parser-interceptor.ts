import { Logger } from '@nestjs/common';
import { stringifyJSON } from '@kedge/common';
import {
  SchemaValidationError,
  type Interceptor,
  type QueryResultRow,
} from 'slonik';

const logger = new Logger('pg:interceptor:result-parser');
export const createResultParserInterceptor = (): Interceptor => {
  return {
    // If you are not going to transform results using Zod, then you should use `afterQueryExecution` instead.
    // Future versions of Zod will provide a more efficient parser when parsing without transformations.
    // You can even combine the two – use `afterQueryExecution` to validate results, and (conditionally)
    // transform results as needed in `transformRow`.
    transformRow: (executionContext, actualQuery, row) => {
      const { resultParser } = executionContext;

      if (!resultParser) {
        return row;
      }

      // Handle data type transformations
      const transformedRow = Object.entries(row).reduce((acc, [key, value]) => {
        if (typeof value === 'bigint') {
          // Keep large numbers as strings for safety, or handle potential precision loss if Number conversion is necessary
          // For now, let's convert to string to avoid NaN/Infinity issues with Number()
          acc[key] = value.toString();
        } else if (key.endsWith('_at') && typeof value === 'number') {
          // Handle datetime fields
          acc[key] = new Date(value).toISOString();
        } else if (typeof value === 'string' && value.endsWith('n')) {
          // Handle numeric strings safely
          const numStr = value.slice(0, -1);
          const num = Number(numStr);
          // Only assign if it's a valid number, otherwise keep original or assign null/undefined based on needs
          acc[key] = !isNaN(num) ? num : value; // Keep original string if conversion fails
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, unknown>);

      const validationResult = resultParser.safeParse(transformedRow);

      if (validationResult.success === false) {
        logger.error(
          `Validation result: ${stringifyJSON(validationResult, 2)}
          query: ${actualQuery.sql}
          value: ${stringifyJSON(actualQuery.values, 2)}
          ---
          row: ${stringifyJSON(row, 2)}
          `,
        );
        throw new SchemaValidationError(
          actualQuery,
          row,
          validationResult.error.issues,
        );
      }

      return validationResult.data as QueryResultRow;
    },
  };
};
