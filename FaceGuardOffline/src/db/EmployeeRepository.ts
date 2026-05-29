import { Employee } from '../types';
import { getDatabase } from './Database';
import { float32ArrayToBase64, base64ToFloat32Array } from '../utils/imageUtils';

export function float32ArrayToBlob(arr: Float32Array): string {
  return float32ArrayToBase64(arr);
}

export function blobToFloat32Array(blob: string): Float32Array {
  return base64ToFloat32Array(blob);
}

function rowToEmployee(row: {
  id: string;
  name: string;
  employee_code: string;
  embedding: string;
  thumbnail_hash: string;
  enrolled_at: number;
  updated_at: number;
}): Employee {
  return {
    id: row.id,
    name: row.name,
    employeeCode: row.employee_code,
    embedding: blobToFloat32Array(row.embedding),
    thumbnailHash: row.thumbnail_hash,
    enrolledAt: row.enrolled_at,
  };
}

export async function insertEmployee(employee: Employee): Promise<void> {
  const db = await getDatabase();
  const embeddingBlob = float32ArrayToBlob(employee.embedding);
  const now = Date.now();
  await db.executeSql(
    `INSERT INTO employees (id, name, employee_code, embedding, thumbnail_hash, enrolled_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      employee.id,
      employee.name,
      employee.employeeCode,
      embeddingBlob,
      employee.thumbnailHash,
      employee.enrolledAt,
      now,
    ],
  );
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT * FROM employees WHERE id = ?;',
    [id],
  );
  if (result.rows.length === 0) return null;
  return rowToEmployee(result.rows.item(0));
}

export async function getAllEmployees(): Promise<Employee[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT * FROM employees ORDER BY enrolled_at ASC;',
  );
  const employees: Employee[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    employees.push(rowToEmployee(result.rows.item(i)));
  }
  return employees;
}

export async function deleteEmployee(id: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM employees WHERE id = ?;', [id]);
}

export async function updateEmbedding(
  id: string,
  embedding: Float32Array,
): Promise<void> {
  const db = await getDatabase();
  const blob = float32ArrayToBlob(embedding);
  const now = Date.now();
  await db.executeSql(
    'UPDATE employees SET embedding = ?, updated_at = ? WHERE id = ?;',
    [blob, now, id],
  );
}

export async function getEmployeeByCode(
  employeeCode: string,
): Promise<Employee | null> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT * FROM employees WHERE employee_code = ?;',
    [employeeCode],
  );
  if (result.rows.length === 0) return null;
  return rowToEmployee(result.rows.item(0));
}
