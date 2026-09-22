export const types = ['check', 'ban', 'cross_red', 'black_dot', 'red_dot', 'green_dot', 'yellow_dot', 'exclamation'];

export const getSymbol = (type) => {
    switch (type) {
        case 'check': return '✅';
        case 'ban': return '🚫';
        case 'cross_red': return '❌';
        case 'black_dot': return '⚫';
        case 'red_dot': return '🔴';
        case 'green_dot': return '🟢';
        case 'yellow_dot': return '🟡';
        case 'exclamation': return '❗';
        default: return '✅';
    }
};

const SymbolToggle = ({ type, onToggle, isEditable }) => {
    const symbol = getSymbol(type);

    // Removed custom red styling for cross_red as the emoji ❌ is naturally red
    const customStyle = {};

    return (
        <span
            style={{
                cursor: isEditable ? 'pointer' : 'default',
                marginRight: '0.5rem',
                fontSize: '1.2rem',
                userSelect: 'none',
                ...customStyle
            }}
            onClick={(e) => {
                if (isEditable && onToggle) {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggle();
                }
            }}
            title={isEditable ? "Click para cambiar símbolo" : ""}
        >
            {symbol}
        </span>
    );
};

export default SymbolToggle;
