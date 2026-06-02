interface Props {
  onSelect: (suggestion: string) => void;
}

const suggestions = [
  '查询技术部的员工',
  '搜索姓名包含"张"的员工',
  '查询薪酬等级为P7的员工',
  '查询30岁以上的员工',
];

export default function QuickSuggestions({ onSelect }: Props) {
  return (
    <div className="quick-suggestions">
      {suggestions.map((s) => (
        <button
          key={s}
          className="suggestion-btn"
          onClick={() => onSelect(s)}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
