import { Client, Databases, ID, Query} from 'appwrite';

const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;  

const client = new Client()
    .setEndpoint("https://cloud.appwrite.io/v1") // Your Appwrite Endpoint  
    .setProject(PROJECT_ID); // Your project ID

const databases = new Databases(client);

export const updateSearchCount = async (searchTerm, movie) => {
//1. use appwrite api to check if document exists for searchTerm
try{
    const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
       [Query.equal('searchTerm', searchTerm)] 
    );
    //2. if it exists, update the count
    if (result.documents.length > 0) {
        const doc = result.documents[0];
        await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_ID,
            doc.$id,
            {
                count: doc.count + 1,
            }
        );
    } else {
        //3. if it doesn't exist, create a new document with count 1
       await databases.createDocument(
            DATABASE_ID,
            COLLECTION_ID,
            ID.unique(),
            {
                searchTerm: searchTerm,
                count: 1,
                movie_id: movie.id, // Assuming movie has an id property
                poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`, // Assuming movie has a title property
            }
        ); 
            
    }
}
catch (error) {
    console.error("Error updating search count:", error);
}
   

}
// Function to get trending movies based on search count
export const getTrendingMovies = async () => {
 try {
  const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.limit(5),
    Query.orderDesc("count")
  ])

  return result.documents;
 } catch (error) {
  console.error(error);
 }
}