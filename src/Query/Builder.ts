import { FieldPacket, RowDataPacket } from 'mysql2/promise';
import { Connection } from '../Connection';
import { InvalidArgumentException } from '../Support/Exceptions/InvalidArgumentException';
import { MySqlGrammar, WhereInfo } from './MySqlGrammar';

type WhereColumnParameter = [string, any, any?];

export class Builder {
    protected connection: Connection;
    public grammar: MySqlGrammar;
    public table: string = '';
    public selects: string[] = ['*'];
    public wheres: WhereInfo[] = [];

    public bindings: { [key: string]: any[] } = {
        where: []
    };

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

    constructor(connection: Connection, grammar: MySqlGrammar | null = null) {
        this.connection = connection;
        this.grammar = grammar ?? this.connection.getQueryGrammar();
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
        column: string | WhereColumnParameter[],
        operator: any = null,
        value: any = null,
        boolean: string = 'and'
    ): this {
        let type = 'Basic';

        if (typeof column === 'object') {
            return this.addArrayOfWheres(column, boolean);
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

        this.addBinding(value, 'where');

        return this;
    }

    protected addArrayOfWheres(
        columns: WhereColumnParameter[],
        boolean: string
    ): this {
        columns.forEach(column => {
            if (
                !Array.isArray(column) ||
                column.length < 2 ||
                column.length > 3
            ) {
                throw new Error(
                    'Invalid column format. Expected an array with length 2 or 3.'
                );
            }

            const [fieldName, operator, value] = column;

            if (typeof fieldName !== 'string') {
                throw new Error('Column element must be a string.');
            }

            this.where(fieldName, operator, value || null, boolean);
        });

        return this;
    }

    public orWhere(
        column: string | WhereColumnParameter[],
        operator: any = null,
        value: any = null
    ): this {
        [value, operator] = this.prepareValueAndOperator(
            value,
            operator,
            value === null && operator !== null
        );

        return this.where(column, operator, value, 'or');
    }

    // TODO: Added Basic Where Clauses:
    // Where, OrWhere, WhereNot, WhereBetween, WhereIn,
    // WhereNotIn, WhereNull, WhereNotNull, WhereDate,
    // WhereMonth, WhereDay, WhereYear, WhereTime

    public toSql(): string {
        return this.grammar.compileSelect(this);
    }

    public async get(): Promise<[RowDataPacket[], FieldPacket[]]> {
        return await this.connection.execute(this.toSql(), this.getBindings());
    }

    public getBindings(): any[] {
        return Object.values(this.bindings).reduce(
            (accumulator, value) => accumulator.concat(value),
            []
        );
    }

    public addBinding(value: any, type: string = 'where'): this {
        if (!(type in this.bindings)) {
            throw new InvalidArgumentException(`Invalid binding type: ${type}`);
        }

        if (Array.isArray(value)) {
            this.bindings[type] = [
                ...this.bindings[type],
                ...value.map(this.castBinding.bind(this))
            ];
        } else {
            this.bindings[type].push(this.castBinding(value));
        }

        return this;
    }

    // TODO: Add more casting
    public castBinding(value: any): any {
        return value;
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
