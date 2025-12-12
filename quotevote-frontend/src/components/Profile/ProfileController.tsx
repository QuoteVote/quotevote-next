'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { GET_USER } from '@/graphql/queries';
import ProfileView from './ProfileView';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function ProfileController() {
    const params = useParams();
    const username = params?.username as string;

    const conditions = ['POSTED', 'VOTED', 'COMMENTED', 'QUOTED'];
    const [selectedEvent, setSelectedEvent] = useState<string[]>(conditions);
    const [selectAll, setSelectAll] = useState<string>('ALL');
    const [offset, setOffset] = useState(1);
    const limit = 5;
    const [userInfo, setUserInfo] = useState<any>({});

    // Mock logged in user for now, or get from context
    const loggedInUser = { username: 'testuser' };

    const { data: userData, loading } = useQuery(GET_USER, {
        variables: { username: username || loggedInUser.username },
        skip: !username && !loggedInUser.username,
    });

    const handleActivityEvent = (_event: any, newActivityEvent: string[]) => {
        if (!newActivityEvent.length) {
            setSelectAll('ALL');
            setSelectedEvent(conditions);
        } else {
            const isAllToggled = newActivityEvent.length === 4;
            setSelectAll(isAllToggled ? 'ALL' : '');
            setSelectedEvent(newActivityEvent);
        }
    };

    const handleSelectAll = (_event: any, newSelectAll: string) => {
        if (newSelectAll) {
            setSelectedEvent(conditions);
        }
        setSelectAll(newSelectAll);
    };

    useEffect(() => {
        if (userData) {
            setUserInfo((userData as any).user);
        }
    }, [userData]);

    if (loading) return <LoadingSpinner />;

    return (
        <ProfileView
            handleActivityEvent={handleActivityEvent}
            handleSelectAll={handleSelectAll}
            selectAll={selectAll}
            filterState={{}} // Placeholder
            setOffset={setOffset}
            profileUser={userInfo}
            limit={limit}
            offset={offset}
            selectedEvent={selectedEvent}
            loading={loading}
        />
    );
}
