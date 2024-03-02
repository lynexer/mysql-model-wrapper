export class MySqlGrammar {
    protected operators: string[] = ['sounds like'];
    protected bitwiseOperators: string[] = [];
    protected tablePrefix: string = '';
    protected selectComponents: string[] = ['selects', 'table', 'wheres'];
}
