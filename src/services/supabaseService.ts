import { getSupabase } from '../lib/supabase';
import { Book, UserProfile, AuthorProfile, ReaderInteraction } from '../types';

export const supabaseService = {
  // Auth
  async getCurrentUser() {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    return profile as UserProfile;
  },

  async createUserProfile(profile: Partial<UserProfile>) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('users')
      .insert(profile)
      .select()
      .single();
    
    if (error) throw error;
    return data as UserProfile;
  },

  async updateAuthorProfile(profile: Partial<AuthorProfile>) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('authors')
      .upsert(profile)
      .select()
      .single();
    
    if (error) throw error;
    return data as AuthorProfile;
  },

  async saveInteraction(interaction: Omit<ReaderInteraction, 'id' | 'timestamp'>) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('interactions')
      .insert(interaction)
      .select()
      .single();
    
    if (error) {
      // Fallback to snake_case if camelCase fails
      const snakeInteraction = {
        user_id: interaction.userId,
        book_title: interaction.bookTitle,
        question: interaction.question,
        ai_response: interaction.aiResponse
      };
      const { data: retryData, error: retryError } = await supabase
        .from('interactions')
        .insert(snakeInteraction)
        .select()
        .single();
      
      if (retryError) throw retryError;
      return retryData as ReaderInteraction;
    }
    return data as ReaderInteraction;
  },

  async getInteractions(userId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('userId', userId)
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    return data as ReaderInteraction[];
  },

  async signInWithGoogle() {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
  },

  // Books
  async uploadBookPDF(file: File, authorId: string, title: string) {
    const supabase = getSupabase();
    const fileExt = file.name.split('.').pop();
    const fileName = `${authorId}/${Date.now()}.${fileExt}`;
    const filePath = `books/${fileName}`;

    // 1. Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from('books')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Insert into Database
    const { data, error: dbError } = await supabase
      .from('books')
      .insert({
        author_id: authorId,
        title: title,
        pdf_path: filePath,
        metadata: {
          original_name: file.name,
          size: file.size,
          type: file.type
        }
      })
      .select()
      .single();

    if (dbError) throw dbError;
    return data;
  },

  async getBooks() {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('books')
      .select('*, authors(users(name))');
    
    if (error) throw error;

    // Map to our Book interface
    return data.map((b: any) => ({
      id: b.id,
      title: b.title,
      author: b.authors?.users?.name || 'Unknown Author',
      coverUrl: `https://picsum.photos/seed/${b.id}/400/600`, // Placeholder cover
      progress: 0,
      category: 'New',
      content: 'Content processing...',
      chapters: [],
      pdf_path: b.pdf_path,
      uploaded_at: b.uploaded_at,
      metadata: b.metadata
    })) as Book[];
  },

  async getAuthorProfile(userId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('authors')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) return null;
    return data as AuthorProfile;
  }
};
