import { Input, Select, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';

interface SearchBarProps {
  onSearch: (platform: string, keyword: string) => void;
  loading?: boolean;
}

export default function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [platform, setPlatform] = useState('bilibili');
  const [keyword, setKeyword] = useState('');

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      <Select
        value={platform}
        onChange={setPlatform}
        style={{ width: 140 }}
        options={[
          { value: 'bilibili', label: 'B站' },
          { value: 'youtube', label: 'YouTube' },
        ]}
      />
      <Input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="输入关键词搜索"
        onPressEnter={() => onSearch(platform, keyword)}
        style={{ flex: 1 }}
      />
      <Button
        type="primary"
        icon={<SearchOutlined />}
        loading={loading}
        onClick={() => onSearch(platform, keyword)}
      >
        搜索
      </Button>
    </div>
  );
}
