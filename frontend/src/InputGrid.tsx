import React, { useState, useEffect } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    type ColumnDef,
} from '@tanstack/react-table';

export interface InputRow {
    key: string;
    value: string;
}

interface InputGridProps {
    data: InputRow[];
    onChange: (data: InputRow[]) => void;
}

// Editable Cell Component
const EditableCell = ({
    getValue,
    row: { index },
    column: { id },
    table,
}: any) => {
    const initialValue = getValue();
    const [value, setValue] = useState(initialValue);

    // When the input is blurred, we'll update the data
    const onBlur = () => {
        table.options.meta?.updateData(index, id, value);
    };

    // If the initialValue is changed external, sync it up with our state
    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    const isValueColumn = id === 'value';

    return (
        <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={onBlur}
            className={`w-full bg-transparent px-3 py-2 border border-transparent hover:border-slate-200 focus:border-slate-900 focus:outline-none text-sm transition-all ${isValueColumn ? 'text-right font-mono' : ''}`}
            placeholder={id === 'key' ? 'Variable Name' : 'Value'}
        />
    );
};

export function InputGrid({ data, onChange }: InputGridProps) {
    const columns = React.useMemo<ColumnDef<InputRow>[]>(
        () => [
            {
                accessorKey: 'key',
                header: 'Variable Name',
                cell: EditableCell,
                size: 140,
            },
            {
                accessorKey: 'value',
                header: 'Value / Expression',
                cell: EditableCell,
            },
            {
                id: 'actions',
                header: '',
                cell: ({ row }) => (
                    <button
                        onClick={() => {
                            const newData = [...data];
                            newData.splice(row.index, 1);
                            onChange(newData);
                        }}
                        className="text-slate-300 hover:text-red-600 p-1 transition-colors"
                        title="Delete Row"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                ),
                size: 40,
            },
        ],
        [data, onChange]
    );

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        meta: {
            updateData: (rowIndex: number, columnId: string, value: string) => {
                const newData = data.map((row, index) => {
                    if (index === rowIndex) {
                        return {
                            ...data[rowIndex]!,
                            [columnId]: value,
                        };
                    }
                    return row;
                });
                onChange(newData);
            },
        },
    });

    const addRow = () => {
        onChange([...data, { key: '', value: '' }]);
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="flex-1 overflow-auto">
                <table className="min-w-full">
                    <thead className="bg-white sticky top-0 z-10 border-b-2 border-slate-900">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="px-3 py-2 text-left text-[10px] font-bold text-slate-600 uppercase tracking-wider"
                                        style={{ width: header.getSize() }}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="bg-white">
                        {table.getRowModel().rows.map((row, idx) => (
                            <tr key={row.id} className={`hover:bg-slate-50 group border-b border-slate-100 ${idx % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id} className="px-0 py-0 text-sm text-slate-900">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {data.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <p className="text-sm">No inputs defined.</p>
                        <button
                            onClick={addRow}
                            className="mt-3 text-slate-900 hover:underline text-sm font-medium"
                        >
                            Add your first variable
                        </button>
                    </div>
                )}
            </div>
            <div className="p-3 border-t border-slate-900 bg-white">
                <button
                    onClick={addRow}
                    className="w-full py-2.5 border border-slate-300 bg-white text-slate-900 hover:border-slate-900 hover:bg-slate-50 transition-all text-sm font-semibold flex items-center justify-center gap-2 uppercase tracking-wide"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Variable
                </button>
            </div>
        </div>
    );
}
