import { getSupabase } from '../lib/supabase';
import { Book, UserProfile, AuthorProfile, ReaderInteraction } from '../types';

export const supabaseService = {
  // Auth
  async getCurrentUser() {
    const supabase = getSupabase();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log('[Auth] getCurrentUser user:', user?.id);
    if (userError) console.error('[Auth] getCurrentUser error:', userError);
    if (!user) return null;

    // Fetch profile
    let { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    console.log('[Auth] Profile fetch result:', profile ? 'Found' : 'Not Found', error || '');
    
    // If no profile exists, create one from Google metadata
    if (!profile && !error) {
      console.log('[Auth] Creating new profile for:', user.id);
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata.full_name || user.email?.split('@')[0] || 'Reader',
          role: 'reader'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('[Auth] Profile creation failed:', createError);
      } else {
        console.log('[Auth] Profile created successfully');
        return newProfile as UserProfile;
      }
    }
    
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
    // Fetch books with author name and chapter titles/metadata
    const { data, error } = await supabase
      .from('books')
      .select('*, authors(users!user_id(name)), chapters(id, title, sequence_number)');
    
    if (error) throw error;

    // Map to our Book interface
    return data.map((b: any) => ({
      id: b.id,
      title: b.title,
      author: b.authors?.users?.name || 'Unknown Author',
      coverUrl: `https://picsum.photos/seed/${b.id}/400/600`,
      progress: 0,
      category: b.category || 'New',
      content: 'Select a chapter to begin reading...',
      chapters: (b.chapters || [])
        .sort((a: any, b: any) => a.sequence_number - b.sequence_number)
        .map((c: any) => ({
          id: c.id,
          title: c.title,
          content: '' // Content fetched on demand or kept empty in library view
        })),
      pdf_path: b.pdf_path,
      uploaded_at: b.uploaded_at,
      metadata: b.metadata
    })) as Book[];
  },

  async getBookChapter(chapterId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('chapters')
      .select('content')
      .eq('id', chapterId)
      .single();
    
    if (error) throw error;
    return data.content;
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
