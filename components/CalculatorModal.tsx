
import React, { useState, useCallback } from 'react';
import Modal from './Modal'; // Assuming Modal component is in the same directory or accessible

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalculatorModal: React.FC<CalculatorModalProps> = ({ isOpen, onClose }) => {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const [operand, setOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(true);
  const [history, setHistory] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const performCalculation = (val1: number, val2: number, op: string): number => {
    switch (op) {
      case '+': return val1 + val2;
      case '-': return val1 - val2;
      case '*': return val1 * val2;
      case '/': return val2 === 0 ? Infinity : val1 / val2; // Handle division by zero
      default: return val2;
    }
  };

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplayValue(digit);
      setWaitingForOperand(false);
    } else {
      setDisplayValue(displayValue === '0' ? digit : displayValue + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplayValue('0.');
      setWaitingForOperand(false);
    } else if (!displayValue.includes('.')) {
      setDisplayValue(displayValue + '.');
    }
  };

  const handleOperator = (nextOperator: string) => {
    const inputValue = parseFloat(displayValue);

    if (operand === null) {
      setOperand(inputValue);
    } else if (operator) {
      const result = performCalculation(operand, inputValue, operator);
      setDisplayValue(String(result));
      setOperand(result);
      setHistory(prev => `${prev} ${operator} ${inputValue} = ${result} ; `);
    }
    
    setWaitingForOperand(true);
    setOperator(nextOperator);
    setHistory(prev => `${prev} ${displayValue} ${nextOperator}`);
  };

  const handleEquals = () => {
    const inputValue = parseFloat(displayValue);
    if (operator && operand !== null) {
      const result = performCalculation(operand, inputValue, operator);
      setDisplayValue(String(result));
      setHistory(prev => `${prev} ${inputValue} = ${result}`);
      setOperand(null); // Reset for new calculation
      setOperator(null);
      setWaitingForOperand(true);
    }
  };
  
  const clearAll = () => {
    setDisplayValue('0');
    setOperand(null);
    setOperator(null);
    setWaitingForOperand(true);
    setHistory('');
  };

  const clearEntry = () => {
    setDisplayValue('0');
    setWaitingForOperand(true); // Allow new number entry after CE
  };

  const backspace = () => {
    setDisplayValue(displayValue.length > 1 ? displayValue.slice(0, -1) : '0');
    if (displayValue.length === 1) setWaitingForOperand(true);
  };
  
  const handleUnaryOperation = (operation: string) => {
    const currentValue = parseFloat(displayValue);
    let result = currentValue;
    let operationSymbol = '';

    switch (operation) {
      case 'sqrt':
        if (currentValue < 0) { setDisplayValue("Error"); return; }
        result = Math.sqrt(currentValue);
        operationSymbol = '√';
        setHistory(`${operationSymbol}(${currentValue})`);
        break;
      case 'square':
        result = currentValue * currentValue;
        operationSymbol = '²';
        setHistory(`(${currentValue})${operationSymbol}`);
        break;
      case 'reciprocal':
        if (currentValue === 0) { setDisplayValue("Error"); return; }
        result = 1 / currentValue;
        operationSymbol = '1/';
        setHistory(`${operationSymbol}(${currentValue})`);
        break;
      case 'percentage':
        // Percentage typically needs context (e.g. % of what?). 
        // Simple implementation: divides by 100.
        // Or if an operand is present, it's X% of operand.
        if (operand !== null && operator) {
            const percentageOfOperand = (operand * currentValue) / 100;
            setDisplayValue(String(percentageOfOperand));
            // Don't set waitingForOperand or change operator yet, user might continue with the operator
            setHistory(`${operand} ${operator} ${currentValue}% [${percentageOfOperand}]`);
            return; 
        } else {
            result = currentValue / 100;
            setHistory(`(${currentValue})%`);
        }
        break;
      case 'negate':
        result = currentValue * -1;
        setHistory(`negate(${currentValue})`);
        break;
    }
    setDisplayValue(String(result));
    // For unary ops, typically we are still waiting for an operand if an operator was pressed before.
    // Or if no operator, it's a new start.
    // setWaitingForOperand(true); // This might be too aggressive. Let's test.
  };

  const handleCopyResult = useCallback(() => {
    navigator.clipboard.writeText(displayValue).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }).catch(err => console.error("Failed to copy:", err));
  }, [displayValue]);

  const buttons = [
    { label: 'C', type: 'clear-all', class: 'col-span-2 bg-red-600 hover:bg-red-700', action: clearAll },
    { label: '⌫', type: 'operator', class: 'bg-slate-600 hover:bg-slate-500', action: backspace },
    { label: '/', type: 'operator', class: 'bg-slate-600 hover:bg-slate-500', action: () => handleOperator('/') },
    
    { label: '√x', type: 'operator', class: 'bg-slate-600 hover:bg-slate-500', action: () => handleUnaryOperation('sqrt') },
    { label: 'x²', type: 'operator', class: 'bg-slate-600 hover:bg-slate-500', action: () => handleUnaryOperation('square') },
    { label: '1/x', type: 'operator', class: 'bg-slate-600 hover:bg-slate-500', action: () => handleUnaryOperation('reciprocal') },
    { label: '%', type: 'operator', class: 'bg-slate-600 hover:bg-slate-500', action: () => handleUnaryOperation('percentage') },

    { label: '7', type: 'number', action: () => inputDigit('7') },
    { label: '8', type: 'number', action: () => inputDigit('8') },
    { label: '9', type: 'number', action: () => inputDigit('9') },
    { label: '*', type: 'operator', class: 'bg-slate-600 hover:bg-slate-500', action: () => handleOperator('*') },

    { label: '4', type: 'number', action: () => inputDigit('4') },
    { label: '5', type: 'number', action: () => inputDigit('5') },
    { label: '6', type: 'number', action: () => inputDigit('6') },
    { label: '-', type: 'operator', class: 'bg-slate-600 hover:bg-slate-500', action: () => handleOperator('-') },

    { label: '1', type: 'number', action: () => inputDigit('1') },
    { label: '2', type: 'number', action: () => inputDigit('2') },
    { label: '3', type: 'number', action: () => inputDigit('3') },
    { label: '+', type: 'operator', class: 'bg-slate-600 hover:bg-slate-500', action: () => handleOperator('+') },
    
    { label: '+/-', type: 'operator', class: 'bg-slate-600 hover:bg-slate-500', action: () => handleUnaryOperation('negate') },
    { label: '0', type: 'number', action: () => inputDigit('0') },
    { label: '.', type: 'number', action: () => inputDecimal() },
    { label: '=', type: 'equals', class: 'bg-teal-600 hover:bg-teal-700', action: handleEquals },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Calculadora Científica">
      <div className="bg-slate-700 p-4 rounded-lg shadow-inner w-full max-w-sm mx-auto">
        {/* Display */}
        <div className="bg-slate-800 p-3 rounded mb-4 text-right">
            <div className="text-xs text-slate-400 h-6 overflow-x-auto text-ellipsis whitespace-nowrap">{history || " "}</div>
            <div className="text-4xl font-mono text-white break-all">{displayValue}</div>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-4 gap-2">
          {buttons.map((btn) => (
            <button
              key={btn.label}
              onClick={btn.action}
              className={`p-4 rounded text-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-opacity-50
                ${btn.class || (btn.type === 'number' ? 'bg-slate-500 hover:bg-slate-400 text-white' : 'bg-slate-600 hover:bg-slate-500 text-white')}
                ${btn.type === 'equals' ? 'focus:ring-teal-400' : btn.type === 'clear-all' ? 'focus:ring-red-400' : 'focus:ring-slate-400'}`}
              aria-label={btn.label}
            >
              {btn.label}
            </button>
          ))}
        </div>
        <button
            onClick={handleCopyResult}
            className="mt-4 w-full p-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
            {copied ? (<><i className="fas fa-check mr-2"></i>Copiado!</>) : (<><i className="fas fa-copy mr-2"></i>Copiar Resultado</>)}
        </button>
      </div>
    </Modal>
  );
};

export default CalculatorModal;
