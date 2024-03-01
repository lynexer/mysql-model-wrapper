import { FieldPacket, RowDataPacket } from 'mysql2/promise';
import { Connection } from '../Connection';

export class Builder {
    protected connection: Connection;
    private table: string = '';
    private selects: string[] = ['*'];

    constructor(connection: Connection) {
        this.connection = connection;
    }

    public from(table: string, as: string | null = null): this {
        this.table = as ? `${table} as ${as}` : table;

        return this;
    }

    public select(columns: string | string[] = ['*']): this {
        this.selects = typeof columns === 'object' ? columns : [columns];

        return this;
    }

    public addSelect(column: string | string[]): this {
        let columns = typeof column === 'object' ? column : [column];
        let concat = this.selects.concat(columns);
        this.selects = [...new Set(concat)];

        return this;
    }

    // TODO: Added Basic Where Clauses:
    // Where, OrWhere, WhereNot, WhereBetween, WhereIn,
    // WhereNotIn, WhereNull, WhereNotNull, WhereDate,
    // WhereMonth, WhereDay, WhereYear, WhereTime

    public async get(): Promise<[RowDataPacket[], FieldPacket[]]> {
        let query = `SELECT ${this.selects.join(',')} FROM ${this.table}`;
        console.log(query);
        return await this.connection.query(query);
    }
}
