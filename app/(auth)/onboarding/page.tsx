import AccountProfile from "@/app/components/forms/AccountProfile";
import { redirect } from "next/navigation";
import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs";

async function Page() {
    const user = await currentUser();
    // if (!user) return null; // to avoid typescript warnings
    if (!user) redirect('/sign-in');

    const userInfo = await fetchUser(user.id);
    if (userInfo?.onboarded) redirect("/");


    const userData = {
        id: user?.id,
        objectId: userInfo?._id,
        username: userInfo ? userInfo?.username : user?.username,
        name: userInfo ? userInfo?.name : user?.firstName || "",
        bio: userInfo ? userInfo?.bio : "",
        image: userInfo ? userInfo?.image : user?.imageUrl,
    }
    return (
        <main className="onboarding-main mx-auto flex max-w-3xl flex-col justify-start px-10 py-20">
            <div className="head-text">Onboarding</div>
            <p className="mt-3 text-base-regular text-light-2">
                Complete your profile to continue to Threads 2.0
            </p>

            <section className="profile-section mt-9 p-10 rounded-xl">
                <AccountProfile
                    user={userData}
                    btnTitle="Continue"
                />
            </section>
        </main>
    )
}

export default Page;