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

    protected wrapValue(value: string): string {
        if (value !== '*') {
            return '`' + value.replace(/"/g, '""') + '`';
        }

        return value;
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
