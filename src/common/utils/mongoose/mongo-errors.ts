import { mongo } from 'mongoose';
// checking duplicate idempotency key errors
export function isDuplicateKeyError(
  err: unknown,
  field?: string,
): err is mongo.MongoServerError {
  return (
    err instanceof mongo.MongoServerError &&
    err.code === 11000 &&
    (field === undefined || field in (err.keyPattern ?? {}))
  );
}
