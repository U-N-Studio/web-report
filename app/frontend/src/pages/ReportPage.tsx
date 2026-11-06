import { useEffect, useState } from 'react';
import { List, Tag, Typography, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { Report } from '@shared/types';

const { Text } = Typography;

export default function ReportPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.getReports().then((r) => setReports(r));
  }, []);

  if (reports.length === 0) return <Empty description="暂无报告" />;

  return (
    <List
      dataSource={reports}
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
                <Text type="secondary">评论: {item.totalComments} | 违规: {item.flaggedComments}</Text>
                <br />
                <Text type="secondary">{item.createdAt}</Text>
              </div>
            }
          />
        </List.Item>
      )}
    />
  );
}
