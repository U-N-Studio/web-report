import { useEffect, useState } from 'react';
import { List, Tag, Typography, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';

const { Text } = Typography;

export default function ReportPage() {
  const [reports, setReports] = useState<unknown[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.getReports().then((r) => setReports(r as unknown[]));
  }, []);

  if (reports.length === 0) return <Empty description="暂无报告" />;

  return (
    <List
      dataSource={reports as { id: string; platform: string; url: string; title?: string; keyword?: string; total_comments: number; flagged_comments: number; created_at: string }[]}
      renderItem={(item) => (
        <List.Item
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/reports/${item.id}`)}
        >
          <List.Item.Meta
            title={item.title || item.url}
            description={
              <div>
                <Tag>{item.platform}</Tag>
                <Text type="secondary">评论: {item.total_comments} | 违规: {item.flagged_comments}</Text>
                <br />
                <Text type="secondary">{item.created_at}</Text>
              </div>
            }
          />
        </List.Item>
      )}
    />
  );
}
