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
