import { Builder as QueryBuilder } from './Builder';

export type WhereInfo = {
    type: string;
    column: string;
    operator: string;
    value: any;
    boolean: string;
};

export class MySqlGrammar {
    protected operators: string[] = ['sounds like'];
    protected bitwiseOperators: string[] = [];
    protected tablePrefix: string = '';

    protected selectComponents: string[] = ['selects', 'table', 'wheres'];

    public wrap(value: string): string {
        if (value.includes(' as ')) {
            return this.wrapAliasedValue(value);
        }

        return this.wrapSegments(value.split('.'));
    }

    public wrapTable(table: string): string {
        if (table.includes(' as ')) {
            return this.wrapAliasedTable(table);
        }

        if (table.includes('.')) {
            table = table.replace(/\.(?=[^.]*$)/, '.' + this.tablePrefix);

            return table
                .split('.')
                .map((value: string) => this.wrapValue(value))
                .join('.');
        }

        return this.wrapValue(this.tablePrefix + table);
    }

    protected wrapAliasedValue(value: string): string {
        const segments: string[] = value.split(/\s+as\s+/i);

        return `${this.wrap(segments[0])} as ${this.wrapValue(segments[1])}`;
    }

    protected wrapAliasedTable(value: string): string {
        const segments: string[] = value.split(/\s+as\s+/i);

        return `${this.wrapTable(segments[0])} as ${this.wrapValue(this.tablePrefix + segments[1])}`;
    }

    protected wrapSegments(segments: string[]): string {
        return segments
            .map((value: string, index: number) => {
                return index === 0 && segments.length > 1
                    ? this.wrapTable(value)
                    : this.wrapValue(value);
            })
            .join('.');
    }

    public compileWheres(query: QueryBuilder): string {
        if (query.wheres.length === 0) {
            return '';
        }

        let sql = this.compileWheresToArray(query);

        if (sql.length > 0) {
            return this.concatenateWhereClauses(query, sql);
        }

        return '';
    }

    protected compileWheresToArray(query: QueryBuilder): string[] {
        return query.wheres.map((where: WhereInfo) => {
            // TODO: Choose correct where method depending on type
            return where.boolean + ' ' + this.whereBasic(query, where);
        });
    }

    protected concatenateWhereClauses(
        query: QueryBuilder,
        sql: string[]
    ): string {
        return 'where ' + this.removeLeadingBoolean(sql.join(' '));
    }

    protected whereBasic(query: QueryBuilder, where: WhereInfo): string {
        let value = '?';
        let operator = where.operator.replace('?', '??');

        return `${this.wrap(where.column)} ${operator} ${value}`;
    }

    protected whereBitwise(query: QueryBuilder, where: WhereInfo): string {
        return this.whereBasic(query, where);
    }

    protected wrapValue(value: string): string {
        if (value !== '*') {
            return '`' + value.replace(/"/g, '""') + '`';
        }

        return value;
    }

    public columnize(columns: string[]): string {
        return columns.map(this.wrap.bind(this)).join(', ');
    }

    protected concatenate(segments: string[]): string {
        return segments.filter(value => value !== '').join(' ');
    }

    public getTablePrefix(): string {
        return this.tablePrefix;
    }

    public setTablePrefix(prefix: string): this {
        this.tablePrefix = prefix;

        return this;
    }

    protected removeLeadingBoolean(value: string): string {
        return value.replace(/and |or /i, '');
    }
}
