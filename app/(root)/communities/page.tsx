import PostThread from "@/app/components/forms/PostThread";
import ProfileHeader from "@/app/components/shared/ProfileHeader";
import { fetchUser, fetchUsers } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs";
import { redirect } from 'next/navigation';

import { profileTabs } from "@/constants";
import Image from "next/image";
import ThreadsTab from "@/app/components/shared/ThreadsTab";
import UserCard from "@/app/components/cards/UserCard";
import { fetchCommunities } from "@/lib/actions/community.actions";
import CommunityCard from "@/app/components/cards/CommunityCard";
import Searchbar from "@/app/components/shared/SearchBar";
import Pagination from "@/app/components/shared/Pagination";

async function Page({
    searchParams,
}: {
    searchParams: { [key: string]: string | undefined };
}) {
    const user = await currentUser();

    if (!user) return null;

    const userInfo = await fetchUser(user.id);

    if (!userInfo?.onboarded) redirect('/onboarding');
    //Fetch all communities
    const result = await fetchCommunities({
        searchString: searchParams.q,
        pageNumber: searchParams?.page ? +searchParams.page : 1,
        pageSize: 25,
    });


    return (
        <>
            <section>
                <h1 className="head-text">Search</h1>

                {/* {Search bar} */}
                <div className='mt-5'>
                    <Searchbar routeType='communities' />
                </div>

                <div className="mt-9 flex flex-col gap-4">
                    {result.communities.length === 0 ? (
                        <p className="no-result"> No communities</p>
                    ) : (
                        <>
                            {result.communities.map((community) => (
                                <CommunityCard
                                    key={community.id}
                                    id={community.id}
                                    name={community.name}
                                    username={community.username}
                                    imgUrl={community.image}
                                    bio={community.bio}
                                    members={community.members}
                                />
                            ))}
                        </>
                    )}
                </div>
            </section>
            <Pagination
                path='communities'
                pageNumber={searchParams?.page ? +searchParams.page : 1}
                isNext={result.isNext}
            />
        </>
    )
}

export default Page 