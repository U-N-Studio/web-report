import { useState, useEffect } from 'react';
import { List, Button, Typography, message, Image } from 'antd';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import * as api from '../services/api';

const { Text } = Typography;

export default function SearchPage() {
  const [videos, setVideos] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('bilibili');
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedPlatform === 'bilibili') {
      setLoading(true);
      api.fetchHomepage('bilibili').then((r) => {
        setVideos(r as unknown[]);
      }).catch(() => {
        message.error('加载首页失败');
      }).finally(() => setLoading(false));
    } else {
      setVideos([]);
    }
  }, [selectedPlatform]);

  const handleSearch = async (platform: string, keyword: string) => {
    if (!keyword.trim()) return;
    setLoading(true);
    setSelectedPlatform(platform);
    try {
      const result = await api.searchVideos(platform, keyword);
      setVideos(result as unknown[]);
    } catch {
      message.error('搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (videoId: string) => {
    setLoading(true);
    try {
      const result = await api.analyzeVideo({
        platform: selectedPlatform,
        videoId,
        aiMode: 'cloud',
      });
      const r = result as { reportId: string; total: number; flagged: number };
      if (r.total === 0) {
        message.warning('该视频暂无评论数据，请先在设置页配置 B站 SESSDATA');
      } else {
        message.success(`分析完成：${r.total} 条评论，${r.flagged} 条违规`);
        navigate(`/reports/${r.reportId}`);
      }
    } catch (err) {
      const msg = (err as { message?: string })?.message || '分析失败';
      if (msg.includes('API Key') || msg.includes('400')) {
        message.error('未配置 AI API Key，请在设置页配置后重试');
      } else {
        message.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <SearchBar onSearch={handleSearch} loading={loading} />
      <List
        loading={loading}
        dataSource={videos as { id: string; title: string; url: string; author?: string; thumbnail?: string }[]}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button type="primary" size="small" onClick={() => handleAnalyze(item.id)} loading={loading}>
                AI 分析
              </Button>,
            ]}
          >
            <List.Item.Meta
              avatar={item.thumbnail ? <Image src={item.thumbnail} width={120} height={75} style={{ borderRadius: 4, objectFit: 'cover' }} preview={false} fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" /> : undefined}
              title={<a href={item.url} target="_blank" rel="noreferrer">{item.title}</a>}
              description={<Text type="secondary">{item.author}</Text>}
            />
          </List.Item>
        )}
      />
    </div>
  );
}
