import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface OrderIndependentGroupsEditorProps {
  groups: number[][];
  blanksCount: number;
  onAddGroup: () => void;
  onRemoveGroup: (groupIndex: number) => void;
  onToggleBlankInGroup: (groupIndex: number, blankIndex: number) => void;
}

export default function OrderIndependentGroupsEditor({
  groups,
  blanksCount,
  onAddGroup,
  onRemoveGroup,
  onToggleBlankInGroup
}: OrderIndependentGroupsEditorProps) {
  if (groups.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
        暂无顺序无关组。如果有多个空格答案顺序可以互换（如"辽"和"西夏"），请添加组。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group, groupIndex) => (
        <div key={groupIndex} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              组 {groupIndex + 1}
              {group.length > 0 && (
                <span className="ml-2 text-xs text-gray-600">
                  ({group.map(i => `空格${i + 1}`).join(', ')})
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => onRemoveGroup(groupIndex)}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: blanksCount }, (_, blankIndex) => (
              <label
                key={blankIndex}
                className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors ${
                  group.includes(blankIndex)
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={group.includes(blankIndex)}
                  onChange={() => onToggleBlankInGroup(groupIndex, blankIndex)}
                  className="w-4 h-4"
                />
                <span className="text-sm">空格 {blankIndex + 1}</span>
              </label>
            ))}
          </div>
          {group.length < 2 && (
            <div className="mt-2 text-xs text-orange-600">
              ⚠️ 请至少选择2个空格
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
