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

    return (
        <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={onBlur}
            className="w-full bg-transparent p-1 border-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none rounded"
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
            },
            {
                accessorKey: 'value',
                header: 'Value',
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
                        className="text-red-500 hover:text-red-700 font-bold px-2"
                        title="Delete Row"
                    >
                        ×
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
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto border rounded mb-2">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
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
                    <tbody className="bg-white divide-y divide-gray-200">
                        {table.getRowModel().rows.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50">
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id} className="px-4 py-2 text-sm text-gray-900 border-r last:border-r-0">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {data.length === 0 && (
                    <div className="text-center p-4 text-gray-400 text-sm">
                        No inputs defined. Click "Add Variable" to start.
                    </div>
                )}
            </div>
            <button
                onClick={addRow}
                className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded hover:border-blue-500 hover:text-blue-500 transition-colors text-sm font-medium"
            >
                + Add Variable
            </button>
        </div>
    );
}
