import { FieldPacket, RowDataPacket } from 'mysql2/promise';
import { Connection } from '../Connection';
import { InvalidArgumentException } from '../Support/Exceptions/InvalidArgumentException';

type WhereInfo = {
    type: string;
    column: string;
    operator: string;
    value: any;
    boolean: string;
};

export class Builder {
    protected connection: Connection;
    private table: string = '';
    private selects: string[] = ['*'];
    private wheres: WhereInfo[] = [];

    public bitwiseOperators: string[] = ['&', '|', '^', '<<', '>>', '&~'];
    public operators: string[] = [
        '=',
        '<',
        '>',
        '<=',
        '>=',
        '<>',
        '!=',
        '<=>',
        'like',
        'like binary',
        'not like',
        'ilike',
        '&',
        '|',
        '^',
        '<<',
        '>>',
        '&~',
        'is',
        'is not',
        'rlike',
        'not rlike',
        'regexp',
        'not regexp',
        '~',
        '~*',
        '!~',
        '!~*',
        'similar to',
        'not similar to',
        'not ilike',
        '~~*',
        '!~~*'
    ];

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

    public where(
        column: string | [],
        operator: any = null,
        value: any = null,
        boolean: string = 'and'
    ): this {
        let type = 'Basic';

        if (typeof column === 'object') {
            // TODO: Return array of wheres
        }

        column = column as string;

        [value, operator] = this.prepareValueAndOperator(
            value,
            operator,
            value === null && operator !== null
        );

        if (this.invalidOperatorAndValue(operator, value)) {
            [value, operator] = [operator, '='];
        }

        if (value === null) {
            // TODO: Return where null instead
        }

        if (this.isBitwiseOperator(operator)) {
            type = 'Bitwise';
        }

        this.wheres.push({ type, column, operator, value, boolean });

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

    protected prepareValueAndOperator(
        value: string,
        operator: any,
        useDefault: boolean = false
    ): string[] {
        if (useDefault) {
            return [operator, '='];
        } else if (this.invalidOperatorAndValue(operator, value)) {
            throw new InvalidArgumentException(
                'Illegal operator and value combination.'
            );
        }

        return [value, operator];
    }

    protected invalidOperatorAndValue(operator: string, value: any): boolean {
        return (
            value === null &&
            operator in this.operators &&
            !(operator in ['=', '<>', '!='])
        );
    }

    protected invalidOperator(operator: string): boolean {
        return typeof operator !== 'string' || !(operator in this.operators);
    }

    protected isBitwiseOperator(operator: string): boolean {
        return operator in this.bitwiseOperators;
    }
}
