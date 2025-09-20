import React, { useState, useEffect } from 'react';
import { TrendingUp, Hash, Eye, MessageCircle, Share, ExternalLink, Loader2, User, Heart, Share2, MoreHorizontal, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { faker } from '@faker-js/faker';
import { format } from 'date-fns';

interface TrendingKeyword {
  id: string;
  keyword: string;
  mentions: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  trend: 'up' | 'down' | 'stable';
  locations: string[];
  relatedTags: string[];
}

interface NewsUpdate {
  id: string;
  title: string;
  content: string | null;
  source: string;
  timestamp: Date;
  url: string;
  platform?: string;
}

interface SocialPost {
  id: string;
  platform: 'twitter' | 'facebook' | 'instagram';
  content: string;
  author: string;
  username: string;
  timestamp: Date;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
  };
  hashtags: string[];
  location?: string;
  likes: number;
  comments: number;
}

const SocialTracker: React.FC = () => {
  const [trendingKeywords, setTrendingKeywords] = useState<TrendingKeyword[]>([]);
  const [newsUpdates, setNewsUpdates] = useState<NewsUpdate[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [activeTab, setActiveTab] = useState<'trending' | 'news' | 'social'>('trending');
  
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);

  useEffect(() => {
    // --- Live News Fetching ---
    const fetchNews = async () => {
      const apiKey = import.meta.env.VITE_NEWS_API_KEY;
      if (!apiKey || apiKey === 'YOUR_API_KEY') {
        setNewsError("News API key is not configured. Please add it to your .env file to see live news.");
        setNewsLoading(false);
        return;
      }

      setNewsLoading(true);
      setNewsError(null);
      try {
        const query = encodeURIComponent('(disaster OR flood OR cyclone OR earthquake OR landslide OR "heavy rain") AND India');
        // Note: In a production app, this fetch should be done on a backend server to protect the API key.
        const url = `https://newsapi.org/v2/everything?q=${query}&apiKey=${apiKey}&language=en&sortBy=publishedAt&pageSize=20`;
        
        const response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const transformedNews: NewsUpdate[] = data.articles
          .filter((article: any) => article.title && article.title !== '[Removed]')
          .map((article: any) => ({
            id: article.url,
            title: article.title,
            content: article.description,
            source: article.source.name,
            timestamp: new Date(article.publishedAt),
            url: article.url,
        }));
        
        setNewsUpdates(transformedNews);
      } catch (err: any) {
        setNewsError(err.message || 'Failed to fetch news. Please try again later.');
      } finally {
        setNewsLoading(false);
      }
    };

    fetchNews();

    // --- Mock Data Generation (for sections without live APIs) ---
    const mockKeywords: TrendingKeyword[] = [
      { 
        id: '1', 
        keyword: 'Mumbai Rains', 
        mentions: 1247, 
        sentiment: 'negative', 
        trend: 'up', 
        locations: ['Mumbai', 'Thane', 'Navi Mumbai'],
        relatedTags: ['MumbaiRains', 'MumbaiWeather', 'MumbaiFloods']
      },
      { 
        id: '2', 
        keyword: 'Kerala Floods', 
        mentions: 856, 
        sentiment: 'negative', 
        trend: 'up', 
        locations: ['Kochi', 'Alappuzha', 'Idukki'],
        relatedTags: ['KeralaFloods', 'KeralaRains', 'Relief']
      },
      { 
        id: '3', 
        keyword: 'Cyclone Warning Bay of Bengal', 
        mentions: 654, 
        sentiment: 'negative', 
        trend: 'stable', 
        locations: ['Odisha', 'Andhra Pradesh', 'West Bengal'],
        relatedTags: ['Cyclone', 'CycloneAlert', 'StaySafe']
      },
      { 
        id: '4', 
        keyword: 'Delhi Smog', 
        mentions: 432, 
        sentiment: 'negative', 
        trend: 'up', 
        locations: ['Delhi NCR', 'Gurugram', 'Noida'],
        relatedTags: ['DelhiAQI', 'DelhiPollution', 'Smog']
      },
      { 
        id: '5', 
        keyword: 'NDRF Rescue', 
        mentions: 321, 
        sentiment: 'positive', 
        trend: 'up', 
        locations: ['National', 'Assam', 'Bihar'],
        relatedTags: ['NDRF', 'Rescue', 'EmergencyResponse']
      }
    ];

    const mockPosts: SocialPost[] = Array.from({ length: 10 }, () => ({
      id: faker.string.uuid(),
      platform: faker.helpers.arrayElement(['twitter', 'facebook', 'instagram'] as const),
      content: faker.helpers.arrayElement([
        'Water logging seen in several areas of Mumbai. Please avoid unnecessary travel. #MumbaiRains #StaySafe',
        'Evacuation ongoing in coastal areas of Odisha. Authorities doing great work! #Cyclone #OdishaRescue',
        'High waves at Marina Beach. Beach closed for safety. #HighWaves #ChennaiBeach #Safety',
        'Relief materials being distributed in Assam. Thank you to all volunteers! #AssamFloods #FloodRelief',
        'Air quality in Delhi is hazardous. Please wear masks. #DelhiPollution #Smog'
      ]),
      author: faker.person.fullName(),
      username: faker.internet.userName(),
      timestamp: faker.date.recent({ days: 1 }),
      engagement: { 
        likes: faker.number.int({ min: 10, max: 500 }), 
        shares: faker.number.int({ min: 5, max: 100 }), 
        comments: faker.number.int({ min: 2, max: 50 }) 
      },
      hashtags: faker.helpers.arrayElements(['#India', '#Floods', '#Safety', '#Relief', '#Alert', '#Weather'], { min: 2, max: 4 }),
      location: faker.helpers.arrayElement(['Mumbai', 'Chennai', 'Delhi', 'Assam', 'Kerala']),
      likes: faker.number.int({ min: 10, max: 500 }),
      comments: faker.number.int({ min: 2, max: 50 })
    }));

    setTrendingKeywords(mockKeywords);
    setSocialPosts(mockPosts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  }, []);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return '🐦';
      case 'facebook': return '📘';
      case 'instagram': return '📷';
      default: return '💬';
    }
  };

  const renderNewsContent = () => {
    if (newsLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600" />
          <p className="ml-3 sm:ml-4 text-sm sm:text-base text-gray-600">Fetching live news...</p>
        </div>
      );
    }

    if (newsError) {
      return (
        <div className="text-center py-8 sm:py-10 px-3 sm:px-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-base sm:text-lg font-semibold text-yellow-800">Could not load live news</h3>
          <p className="mt-2 text-sm sm:text-base text-yellow-700">{newsError}</p>
        </div>
      );
    }
    
    if (newsUpdates.length === 0) {
      return <p className="text-center text-sm sm:text-base text-gray-500 py-6 sm:py-8">No recent news articles found.</p>;
    }

    return (
      <div className="space-y-3 sm:space-y-4">
        {newsUpdates.map((news, index) => (
          <motion.div
            key={news.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium text-sm sm:text-base text-gray-900 flex-1 mr-3 sm:mr-4 mb-2">{news.title}</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">{news.content}</p>
            <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span>{getPlatformIcon(news.platform || 'news')}</span>
                <span>{format(new Date(news.timestamp), 'HH:mm')}</span>
              </div>
              <div className="flex items-center">
                <Share className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Social Media Tracker</h1>
        <div className="text-xs sm:text-sm text-gray-500">
          Real-time monitoring • Last updated: {format(new Date(), 'HH:mm')}
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto pb-2 sm:pb-0"> 
          {[
            { id: 'trending', label: 'Trending', icon: TrendingUp },
            { id: 'news', label: 'News', icon: ExternalLink },
            { id: 'social', label: 'Social', icon: MessageCircle }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <tab.icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                {tab.label}
              </div>
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'trending' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <div className="space-y-3 sm:space-y-4">
              {trendingKeywords.map((keyword, index) => (
                <motion.div
                  key={keyword.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Hash className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 mr-1.5 sm:mr-2" />
                      <h3 className="font-medium text-sm sm:text-base text-gray-900">{keyword.keyword}</h3>
                    </div>
                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      <span className="text-base sm:text-lg">{getTrendIcon(keyword.trend)}</span>
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${getSentimentColor(keyword.sentiment)}`}>
                        {keyword.sentiment}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className="text-xs sm:text-sm text-gray-600">{keyword.mentions.toLocaleString()} mentions</span>
                    <div className="flex items-center text-xs sm:text-sm text-gray-500">
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />Tracking
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {keyword.relatedTags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Platform Activity</h3>
              <div className="space-y-2 sm:space-y-3">
                {[
                  { name: 'twitter', percentage: 45, trend: 'up' },
                  { name: 'facebook', percentage: 30, trend: 'down' },
                  { name: 'instagram', percentage: 25, trend: 'up' }
                ].map(platform => (
                  <div key={platform.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-base sm:text-lg mr-2">{getPlatformIcon(platform.name)}</span>
                      <span className="text-xs sm:text-sm text-gray-600">{platform.name}</span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className={`h-3 w-3 sm:h-4 sm:w-4 ${platform.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                      <span className="ml-1.5 text-xs sm:text-sm font-medium">{platform.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'news' && renderNewsContent()}

      {activeTab === 'social' && (
        <div className="space-y-3 sm:space-y-4">
          {socialPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                  </div>
                  <div className="ml-2 sm:ml-3">
                    <h3 className="text-sm sm:text-base font-medium text-gray-900">{post.username}</h3>
                    <p className="text-xs text-gray-500">{format(new Date(post.timestamp), 'MMM d, HH:mm')}</p>
                  </div>
                </div>
                <span className="text-base sm:text-lg">{getPlatformIcon(post.platform)}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">{post.content}</p>
              <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <button className="flex items-center hover:text-gray-700">
                    <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    {post.likes}
                  </button>
                  <button className="flex items-center hover:text-gray-700">
                    <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    {post.comments}
                  </button>
                  <button className="flex items-center hover:text-gray-700">
                    <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Share
                  </button>
                </div>
                <button className="hover:text-gray-700">
                  <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SocialTracker;
