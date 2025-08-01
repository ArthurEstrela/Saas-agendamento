import React, { useState, useEffect } from 'react';
import { useAuth, db } from '../../context/AuthContext';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import type { Review } from '../../types';

const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex">
        {[...Array(5)].map((_, i) => (
            <svg key={i} className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);

const ReviewsManagement = () => {
    const { userProfile } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userProfile?.uid) return;

        const q = query(
            collection(db, `users/${userProfile.uid}/reviews`),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reviewsData = snapshot.docs.map(doc => doc.data() as Review);
            setReviews(reviewsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userProfile]);

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-2">Avaliações dos Clientes</h2>
            <div className="flex items-center gap-2 mb-6">
                <StarRating rating={Math.round(userProfile?.averageRating || 0)} />
                <span className="text-gray-400">
                    ({userProfile?.averageRating?.toFixed(1) || 'N/A'} de {userProfile?.reviewCount || 0} avaliações)
                </span>
            </div>

            {loading ? (
                <p className="text-center text-gray-400">A carregar avaliações...</p>
            ) : reviews.length > 0 ? (
                <ul className="space-y-4">
                    {reviews.map(review => (
                        <li key={review.id} className="bg-gray-700 p-4 rounded-lg">
                            <div className="flex items-start">
                                <img src={review.clientPhotoURL || 'https://placehold.co/150x150/1F2937/4B5563?text=?'} alt={review.clientName} className="h-10 w-10 rounded-full object-cover mr-4" />
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-white">{review.clientName}</p>
                                        <StarRating rating={review.rating} />
                                    </div>
                                    <p className="text-sm text-gray-400 mb-2">
                                        {new Date(review.createdAt.toDate()).toLocaleDateString('pt-BR')}
                                    </p>
                                    <p className="text-gray-300">{review.comment}</p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-gray-500 py-8">Ainda não recebeu nenhuma avaliação.</p>
            )}
        </div>
    );
};

export default ReviewsManagement;
