import React, { useState, useEffect } from 'react';
import { MessageSquare, Heart, Share2, AlertTriangle, Loader2, Send, Image as ImageIcon, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Post {
  id: string;
  user_id: string;
  content: string;
  images: string[];
  likes: number;
  comments: number;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string;
  };
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string;
  };
}

const Social: React.FC = () => {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPost, setNewPost] = useState('');
  const [postImages, setPostImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          user:profiles(full_name, avatar_url)
        `)
        .eq('location', 'social')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPosts((data || []).map(alert => ({
        id: alert.id,
        user_id: alert.user_id || '',
        content: alert.message || alert.content || '',
        images: alert.images || [],
        likes: alert.likes || 0,
        comments: alert.comments || 0,
        created_at: alert.created_at,
        user: {
          full_name: alert.user?.full_name || 'Unknown User',
          avatar_url: alert.user?.avatar_url || ''
        }
      })));
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validFiles = filesArray.filter(file => {
        const isValid = file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024;
        if (!isValid) {
          setImageUploadError('Please select images under 5MB');
        }
        return isValid;
      });
      setPostImages(prev => [...prev, ...validFiles]);
      setImageUploadError(null);
    }
  };

  const removeImage = (index: number) => {
    setPostImages(prev => prev.filter((_, i) => i !== index));
    if (postImages.length === 1) {
      setImageUploadError(null);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPost.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      // Upload images first
      const imageUrls = [];
      for (const image of postImages) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `social/${user.id}/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('social-media')
          .upload(filePath, image, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw new Error('Failed to upload images');
        if (data) imageUrls.push(data.path);
      }

      // Create the post
      const { error: postError } = await supabase
        .from('alerts')
        .insert({
          location: 'social',
          message: newPost.trim(),
          severity: 'low',
          title: 'Social Post',
          content: newPost.trim(),
          images: imageUrls,
          likes: 0,
          comments: 0,
          user_id: user.id
        });

      if (postError) throw postError;

      // Reset form
      setNewPost('');
      setPostImages([]);
      fetchPosts(); // Refresh posts
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('alerts')
        .insert({
          location: 'social',
          message: `Liked post ${postId}`,
          severity: 'low',
          title: 'Like',
          user_id: user.id
        });

      if (error) throw error;

      setPosts(prev =>
        prev.map(post =>
          post.id === postId ? { ...post, likes: post.likes + 1 } : post
        )
      );
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      setLoadingComments(prev => ({ ...prev, [postId]: true }));

      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          user:profiles(full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .eq('location', 'comment')
        .order('created_at', { ascending: true });

      if (error) throw error;

      setComments(prev => ({
        ...prev,
        [postId]: (data || []).map(comment => ({
          id: comment.id,
          post_id: comment.post_id,
          user_id: comment.user_id,
          content: comment.message || comment.content,
          created_at: comment.created_at,
          user: {
            full_name: comment.user?.full_name || 'Unknown User',
            avatar_url: comment.user?.avatar_url || ''
          }
        }))
      }));
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleComment = async (postId: string) => {
    if (!user || !newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('alerts')
        .insert({
          location: 'comment',
          message: newComment.trim(),
          severity: 'low',
          title: 'Comment',
          user_id: user.id,
          post_id: postId,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment('');
      fetchComments(postId);
      setPosts(prev =>
        prev.map(post =>
          post.id === postId ? { ...post, comments: post.comments + 1 } : post
        )
      );
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleShare = async (postId: string) => {
    try {
      await navigator.share({
        title: 'Shared Post',
        text: posts.find(p => p.id === postId)?.content || '',
        url: window.location.href
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-500 text-center">{error}</p>
        <button
          onClick={fetchPosts}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Create Post Form */}
      <form onSubmit={handleSubmitPost} className="bg-white rounded-lg shadow p-4 space-y-4">
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
        
        {/* Image Upload */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {postImages.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Upload ${index + 1}`}
                  className="w-20 h-20 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          {imageUploadError && (
            <p className="text-red-500 text-sm">{imageUploadError}</p>
          )}
          
          <div className="flex justify-between items-center">
            <label className="cursor-pointer text-blue-600 hover:text-blue-700">
              <ImageIcon className="w-5 h-5 inline-block mr-2" />
              Add Images
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
            
            <button
              type="submit"
              disabled={submitting || !newPost.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Post
            </button>
          </div>
        </div>
      </form>

      {/* Posts List */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <p className="text-center text-gray-500">No posts yet. Be the first to post!</p>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-white rounded-lg shadow p-4 space-y-4">
              {/* Post Header */}
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  {post.user.avatar_url ? (
                    <img
                      src={post.user.avatar_url}
                      alt={post.user.full_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-500 text-sm">
                      {post.user.full_name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold">{post.user.full_name}</p>
                  <p className="text-sm text-gray-500">{formatDate(post.created_at)}</p>
                </div>
              </div>

              {/* Post Content */}
              <p className="text-gray-800">{post.content}</p>

              {/* Post Images */}
              {post.images && post.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {post.images.map((image, index) => (
                    <img
                      key={index}
                      src={`${supabase.storage.from('social-media').getPublicUrl(image).data.publicUrl}`}
                      alt={`Post image ${index + 1}`}
                      className="rounded-lg object-cover w-full h-48"
                    />
                  ))}
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center space-x-4 pt-2 border-t">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Heart className="w-5 h-5" />
                  <span>{post.likes}</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedPost(selectedPost === post.id ? null : post.id);
                    if (!comments[post.id]) {
                      fetchComments(post.id);
                    }
                  }}
                  className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>{post.comments}</span>
                </button>

                <button
                  onClick={() => handleShare(post.id)}
                  className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Comments Section */}
              {selectedPost === post.id && (
                <div className="space-y-4 pt-4 border-t">
                  {/* Comment Input */}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleComment(post.id)}
                      disabled={!newComment.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-2">
                    {loadingComments[post.id] ? (
                      <div className="flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      </div>
                    ) : comments[post.id]?.length === 0 ? (
                      <p className="text-center text-gray-500 text-sm">No comments yet</p>
                    ) : (
                      comments[post.id]?.map(comment => (
                        <div key={comment.id} className="flex space-x-2 p-2 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            {comment.user.avatar_url ? (
                              <img
                                src={comment.user.avatar_url}
                                alt={comment.user.full_name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-500 text-xs">
                                {comment.user.full_name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{comment.user.full_name}</p>
                            <p className="text-sm">{comment.content}</p>
                            <p className="text-xs text-gray-500">{formatDate(comment.created_at)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Social;