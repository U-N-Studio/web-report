import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Statistic, Row, Col, Card } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import CommentCard from '../components/CommentCard';
import * as api from '../services/api';

const { Title } = Typography;

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<unknown | null>(null);

  useEffect(() => {
    if (id) api.getReportDetail(id).then((r) => setReport(r));
  }, [id]);

  if (!report) return <div>加载中...</div>;

  const r = report as {
    id: string; platform: string; url: string; title?: string;
    total_comments: number; flagged_comments: number;
    comments: { id: string; author?: string; content: string; category?: string; is_violation: boolean; confidence: number; ai_reason?: string }[];
  };

  const handleToggle = async (commentId: string, isViolation: boolean) => {
    await api.updateCommentStatus(commentId, isViolation);
    if (id) api.getReportDetail(id).then((r) => setReport(r));
  };

  const violations = r.comments.filter((c) => c.is_violation);

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/reports')} style={{ marginBottom: 16 }}>
        返回列表
      </Button>
      <Title level={4}>{r.title || r.url}</Title>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}><Card><Statistic title="总评论" value={r.total_comments} /></Card></Col>
        <Col span={8}><Card><Statistic title="违规评论" value={r.flagged_comments} valueStyle={{ color: '#cf1322' }} /></Card></Col>
        <Col span={8}><Card><Statistic title="合规率" value={r.total_comments ? ((r.total_comments - r.flagged_comments) / r.total_comments * 100).toFixed(1) : 0} suffix="%" /></Card></Col>
      </Row>
      <Title level={5}>违规评论 ({violations.length})</Title>
      {violations.map((c) => (
        <CommentCard key={c.id} {...c} onToggleViolation={handleToggle} />
      ))}
      <Title level={5} style={{ marginTop: 16 }}>全部评论 ({r.comments.length})</Title>
      {r.comments.map((c) => (
        <CommentCard key={c.id} {...c} onToggleViolation={handleToggle} />
      ))}
    </div>
  );
}
