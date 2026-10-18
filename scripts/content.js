// true: don't change anything on discord.com
const disableDiscord = true;

function Is(url, www = true)
{
    let wurl = window.location.href;
    
    let str = "";
    console.log(str);
    if(www)
        str = "www.";

    console.log(wurl);
    console.log(url);
    console.log("https://" + str + url);
    
    return wurl.startsWith("https://" + str + url);
}

 function AllChildren(element, callback) 
 {
    // Apply the callback to the current element
    callback(element);

    // Recursively traverse each child
    element.children && Array.from(element.children).forEach(child => {
        AllChildren(child, callback);
    });
}

if(Is("instagram.com"))
{
    console.log("instagram.com loaded");

    // Button on the left that opens the home feed with only accounts we follow
    {
        const followingButton = document.createElement("button");
        followingButton.textContent = "Following";
        followingButton.style.cssText = "position: fixed; left: 10px; top: 50%; transform: translateY(-50%); z-index: 2147483647;" +
            " padding: 8px 12px; border: none; border-radius: 8px; background: #0095f6; color: white; font-weight: bold; cursor: pointer;";
        followingButton.addEventListener("click", () => window.location.href = "https://www.instagram.com/?variant=following");

        // document.body may not exist yet depending on when the script runs
        if(document.body)
            document.body.appendChild(followingButton);
        else
            document.addEventListener("DOMContentLoaded", () => document.body.appendChild(followingButton));
    }
    
    stylesheet = document.styleSheets[0];
    setTimeout(function(){
        stylesheet.insertRule("#mount_0_0_Id > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div > div > div.x78zum5.xdt5ytf.x1t2pt76.x1n2onr6.x1ja2u2z.x10cihs4 > div.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl.x9f619.x16ye13r.xvbhtw8.x78zum5.x15mokao.x1ga7v0g.x16uus16.xbiv7yw.x1uhb9sk.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.x1q0g3np.xqjyukv.x1qjc9v5.x1oa3qoh.x1qughib > div.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl.x9f619.xjbqb8w.x78zum5.x15mokao.x1ga7v0g.x16uus16.xbiv7yw.xixxii4.x13vifvy.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1.x1dr59a3.xeq5yr9.x1n327nk > div > div > div > div > div.x1iyjqo2.xh8yej3 > div:nth-child(4) > span { display: none; }", 0);
        
        const elem = document.querySelectorAll('.x1iyjqo2.xh8yej3');
        console.log(elem);
        // These elements don't exist on every page (profile, followers list...), so check before using them
        [0, 1, 4, 6, 7].forEach(i =>
        {
            const child = elem[1]?.children[i];
            if(child)
                child.style.visibility = 'hidden';
        });

        const sideElem = document.querySelector('.x1dr59a3.x13vifvy.x7vhb2i.x6bx242');
        if(sideElem)
            sideElem.style.visibility = 'hidden';

        
        // right panel
        stylesheet.insertRule(".html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl.x9f619.xjbqb8w.x78zum5.x15mokao.x1ga7v0g.x16uus16.xbiv7yw.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1.x3h4tne.x145d82y.xixxii4 { display: none; }", 0);
        
        // messages
        stylesheet.insertRule(".x78zum5.xdt5ytf.x5yr21d.xa1mljc.xh8yej3.x1bs97v6.x1q0q8m5.x11aubdm.xnc8uc2.x1qhh985 { margin-top: 100vh !important; }", 0);
        
        
    }, 500);

    // Hide suggested posts (only show posts from accounts we follow)
    {
        const suggestedTexts = ["Sugerencia para ti", "Sugerencias para ti", "Seguir", "Suggested for you", "Follow"];

        // true: log why each post was covered (to check nothing wrong gets covered)
        const debugSuggested = false;

        // Main media of the post (skip small images like the profile picture), or null if not loaded yet
        function PostMedia(article)
        {
            return Array.from(article.querySelectorAll('video, img'))
                .find(m => m.tagName === 'VIDEO' || m.getBoundingClientRect().width > 200) || null;
        }

        // true if el is above the photo / video (header), not in the caption or comments
        function InHeader(el, media)
        {
            return el.compareDocumentPosition(media) & Node.DOCUMENT_POSITION_FOLLOWING;
        }

        // Returns the element that marks the post as suggested, or null
        function SuggestedMark(article, media)
        {
            return Array.from(article.querySelectorAll('span, div, button')).find(el =>
                el.children.length === 0 && suggestedTexts.includes(el.textContent.trim()) && InHeader(el, media)
            ) || null;
        }

        // Usernames of the post authors (more than one on collab posts), taken from the profile links in the header
        function PostAuthors(article, media)
        {
            const authors = new Set();
            article.querySelectorAll('a[href]').forEach(a =>
            {
                const match = a.getAttribute('href').match(/^\/([A-Za-z0-9._]+)\/$/);
                if(match && InHeader(a, media))
                    authors.add(match[1]);
            });
            return Array.from(authors);
        }

        // Asks Instagram if we follow the user (same request the hover card uses). Cached so each user is only asked once
        // Resolves to true / false, or null if we couldn't tell (rate limited, network error...)
        const followingCache = new Map();
        const myUserId = (document.cookie.match(/(?:^|; )ds_user_id=(\d+)/) || [])[1];
        // When Instagram rate limits us, don't ask again until this time
        let retryAt = 0;
        function IsFollowing(username)
        {
            if(!followingCache.has(username))
            {
                followingCache.set(username, fetch("/api/v1/users/web_profile_info/?username=" + encodeURIComponent(username),
                    { headers: { "X-IG-App-ID": "936619743392459" }, credentials: "include" })
                    .then(response =>
                    {
                        if(!response.ok)
                            throw new Error("HTTP " + response.status);
                        return response.json();
                    })
                    .then(json => json.data.user.followed_by_viewer || json.data.user.id === myUserId)
                    .catch(error =>
                    {
                        // Unknown: the post is checked again later instead of being treated as following
                        console.log("Couldn't check if we follow " + username + ", retrying later:", error);
                        followingCache.delete(username);
                        retryAt = Date.now() + 30000;
                        return null;
                    }));
            }
            return followingCache.get(username);
        }

        // Yellow div on top of the post, clicking it removes it so the post can be seen
        function CoverPost(article)
        {
            const cover = document.createElement("div");
            cover.className = "clearly-suggested-cover";
            cover.textContent = article.dataset.suggestedLabel + " (click to show)";
            cover.style.cssText = "position: absolute; inset: 0; z-index: 2147483646; background: yellow; color: black;" +
                " display: flex; align-items: center; justify-content: center; font-weight: bold; cursor: pointer;";
            cover.addEventListener("click", e =>
            {
                e.preventDefault();
                e.stopPropagation();
                article.dataset.suggested = "shown";
                cover.remove();
            });

            if(getComputedStyle(article).position === "static")
                article.style.position = "relative";
            article.appendChild(cover);
        }

        function MarkCovered(article, label)
        {
            article.dataset.suggestedLabel = label;
            article.dataset.suggested = "covered";
        }

        setInterval(function()
        {
            // Instagram can reuse an article element for a different post while scrolling, so check it again when the authors change
            document.querySelectorAll('article[data-suggested]').forEach(article =>
            {
                const media = PostMedia(article);
                if(!media || article.dataset.suggestedAuthors === undefined)
                    return;
                if(PostAuthors(article, media).join(",") !== article.dataset.suggestedAuthors)
                {
                    delete article.dataset.suggested;
                    article.querySelector(':scope > .clearly-suggested-cover')?.remove();
                }
            });

            document.querySelectorAll('article:not([data-suggested])').forEach(article =>
            {
                // Media not loaded yet, can't tell header from comments. Checked again on the next tick
                const media = PostMedia(article);
                if(!media)
                    return;

                const authors = PostAuthors(article, media);
                article.dataset.suggestedAuthors = authors.join(",");

                const mark = SuggestedMark(article, media);
                if(mark)
                {
                    MarkCovered(article, "Suggested post");
                    if(debugSuggested)
                        console.log("Suggested post (matched '" + mark.textContent.trim() + "'):", article);
                    return;
                }

                // Posts from people we don't follow that don't say "Follow" anywhere
                if(authors.length === 0 || Date.now() < retryAt)
                    return;

                article.dataset.suggested = "checking";
                Promise.all(authors.map(IsFollowing)).then(following =>
                {
                    // The article was reused for another post while we were asking
                    if(article.dataset.suggested !== "checking" || article.dataset.suggestedAuthors !== authors.join(","))
                        return;

                    if(following.some(f => f))
                    {
                        article.dataset.suggested = "following";
                        return;
                    }

                    // Couldn't tell for any author: check the post again on a later tick
                    if(following.some(f => f === null))
                    {
                        delete article.dataset.suggested;
                        return;
                    }

                    MarkCovered(article, "Not following @" + authors.join(", @"));
                    if(debugSuggested)
                        console.log("Post from people we don't follow (" + authors.join(", ") + "):", article);
                });
            });

            // Instagram re-renders posts and can remove the cover, so put it back until it's clicked
            document.querySelectorAll('article[data-suggested="covered"]').forEach(article =>
            {
                if(!article.querySelector(':scope > .clearly-suggested-cover'))
                    CoverPost(article);
            });
        }, 500);
    }

    // hide
    //html-div xdj266r x14z9mp xat24cr x1lziwak xexx8yu xyri2b x18d9i69 x1c1uobl x9f619 xjbqb8w x78zum5 x15mokao x1ga7v0g x16uus16 xbiv7yw x1plvlek xryxfnj x1c4vz4f x2lah0s xdt5ytf xqjyukv x1qjc9v5 x1oa3qoh x1nhvcw1 x3h4tne x145d82y xixxii4
}
else if(!disableDiscord && Is("discord.com", false))
{
    let once = true;
    setInterval(function()
    {
        // Last three unused group conversations
        {
            var elems = document.querySelectorAll('.content_d125d2')[0];

            elems.children[elems.children.length - 1].style.visibility = 'hidden';
            elems.children[elems.children.length - 2].style.visibility = 'hidden';
            elems.children[elems.children.length - 3].style.visibility = 'hidden';
        }

        // Active now
        {
            var elems = document.querySelectorAll('.scroller__7d20c.thin_d125d2.scrollerBase_d125d2');
            elems[0].style.visibility = 'hidden';
        }
        
        /*
        elems.forEach(elem => 
        {
            let sub = elem.querySelector(".overflowTooltip__972a0.overflow_b0dfc2");
            console.log(sub);
            if(sub.innerHTML.startsWith("ShadowEvil") ||
                sub.innerHTML.startsWith("aoe2") ||
                sub.innerHTML.startsWith("eche, Eze"))
            {
                elem.style.visibility = 'hidden';
                removed = true;
                //elem.style.visibility = "hidden";
            }
        });*/
        
        // Channels folder
        document.querySelector(".folderHeader__48112").style.visibility = 'hidden';

        // Discover button, and two others (bellow channels)
        {
            var elems = document.querySelectorAll(".listItem__650eb");
            elems[elems.length - 1].style.visibility = 'hidden';
            elems[elems.length - 2].style.visibility = 'hidden';
            elems[elems.length - 3].style.visibility = 'hidden';
        }
        
        // Nitro, Shop, etc.
        {
            let cnt = 0;
            var elems = document.querySelectorAll(".channel__972a0.container_e45859");
            elems.forEach(elem => {
                if(cnt <= 3)
                    elem.style.visibility = 'hidden';

                ++cnt;
            });
        }
        
        // Click on "Add Friend" to hide onlines on first run
        if(once)
        {
            document.querySelector(".item__133bf.addFriend__133bf.item_aa8da2.themed_aa8da2").click();
            once = false;
        }
    }, 500);
}
else if(Is("facebook.com", false) || Is("facebook.com", true))
{
    // Ads: covered with a white div, clicking it removes it so the post can be seen
    {
        const adLabels = ["Ad", "Sponsored"];

        function IsAd(post)
        {
            if(post.querySelector('a[href*="/ads/about"], a[aria-label="Ad"], a[aria-label="Sponsored"]'))
                return true;

            // Facebook hides extra letters in the label, so compare the visible text only
            for(const el of post.querySelectorAll('a[role="link"], span'))
            {
                if(el.textContent.length > 60)
                    continue;
                if(adLabels.includes(el.innerText.trim()))
                    return true;
            }
            return false;
        }

        function CoverAd(post)
        {
            const cover = document.createElement("div");
            cover.className = "clearly-ad-cover";
            cover.textContent = "Ad (click to show)";
            cover.style.cssText = "position: absolute; inset: 0; z-index: 10; background: white; color: black;" +
                " display: flex; align-items: center; justify-content: center; font-weight: bold; cursor: pointer;";
            cover.addEventListener("click", e =>
            {
                e.preventDefault();
                e.stopPropagation();
                post.dataset.clearlyAd = "shown";
                cover.remove();
            });

            if(getComputedStyle(post).position === "static")
                post.style.position = "relative";
            post.appendChild(cover);
        }

        setInterval(function()
        {
            document.querySelectorAll('[aria-posinset], [data-pagelet^="FeedUnit"]').forEach(post =>
            {
                if(post.dataset.clearlyAd === "shown")
                    return;
                // Only the outermost post container gets a cover
                if(post.parentElement?.closest('[aria-posinset], [data-pagelet^="FeedUnit"]'))
                    return;
                // Facebook can re-render the post and drop the cover
                if(post.dataset.clearlyAd === "covered")
                {
                    if(!post.querySelector(':scope > .clearly-ad-cover'))
                        CoverAd(post);
                    return;
                }
                if(IsAd(post))
                {
                    post.dataset.clearlyAd = "covered";
                    CoverAd(post);
                }
            });
        }, 10);
    }

    setInterval(function()
    {
        // Right panel
  /*        document.querySelectorAll('ul.x1hc1fzr')
            .style.visibility = 'hidden';
*/
        var elems = document.querySelectorAll('ul.x1hc1fzr');
        elems.forEach(elem => {
            elem.style.visibility = 'hidden';
        });

        // Left panels
        var elems = document.querySelectorAll('.x1n2onr6.x1uc6qws.xyen2ro .x1n2onr6.x1ja2u2z.x9f619.x78zum5.xdt5ytf.x2lah0s.x193iq5w.xjkvuk6.x1cnzs8');
        elems.forEach(elem => {
            elem.style.visibility = 'hidden';
        });

        // Groups panel
        var elems = document.querySelectorAll('.x1n2onr6.x1uc6qws.xyen2ro .xwib8y2.x1y1aw1k');
        elems.forEach(elem => {
            elem.style.visibility = 'hidden';
        });

        // Dunno
        document.querySelector(".x78zum5.xdt5ytf.x1iyjqo2.xw7yly9.x1n2onr6")
            .style.visibility = 'hidden';

        // Stories
        //document.querySelector('.xb57i2i.x1q594ok.x5lxg6s.x78zum5.xdt5ytf.x10wlt62.x1n2onr6.x1ja2u2z.x1pq812k.xfk6m8.x1yqm8si.xjx87ck.xw2csxc.x7p5m3t.x9f619.xat24cr.xwib8y2.x1y1aw1k.x1rohswg.xhfbhpw')
          //  .style.visibility = 'hidden';

        // Add blank space between posts 
        {
            const style = document.createElement('style');
            style.type = 'text/css';

            const cssRule = `.html-div.xdj266r.x14z9mp.x1lziwak.x18d9i69.x1cy8zhl.x78zum5.x1q0g3np.xod5an3.xz9dl7a.x1g0dm76.xpdmqnj {
                margin-top: 100vh !important;
            }`;

            // For modern browsers
            if (style.styleSheet) {
                // For IE8 and below
                style.styleSheet.cssText = cssRule;
            } else {
                style.appendChild(document.createTextNode(cssRule));
            }

            document.head.appendChild(style);

            // Dunno
            document.querySelector('.xwib8y2.x1y1aw1k .x1hc1fzr').style.visibility = 'hidden';
        }

        // Reels
        {
            const style = document.createElement('style');
            style.type = 'text/css';

            const cssRule = `.x9f619.x1n2onr6.x1ja2u2z.x1wsgfga.x9otpla.xwib8y2.x1y1aw1k {
                visibility: hidden !important;
            }`;

            // For modern browsers
            if (style.styleSheet) {
                // For IE8 and below
                style.styleSheet.cssText = cssRule;
            } else {
                style.appendChild(document.createTextNode(cssRule));
            }

            document.head.appendChild(style);

            // Dunno
            document.querySelector('.xwib8y2.x1y1aw1k .x1hc1fzr').style.visibility = 'hidden';
        }
        
        
    }, 500);
}
else if(Is("linkedin.com", true))
{
    setInterval(function()
    {
        // Hide left panel
        document.querySelector(".c4baa5b3.b07a64bb._0aa25f56._1bcb8291")
            .style.visibility = 'hidden';

        // Hide right panel
        document.querySelector(".c4baa5b3._5cdaa5d0._3a2c3290._8dbd9f0f")
            .style.visibility = 'hidden';
    
        
        // Add blank space between posts
        const style = document.createElement('style');
        style.type = 'text/css';

        const cssRule = `div div._8969c64b.efd98e7a._4e14bf6e{
            margin-top: 100vh !important;
        }`;

        // For modern browsers
        if (style.styleSheet) {
            // For IE8 and below
            style.styleSheet.cssText = cssRule;
        } else {
            style.appendChild(document.createTextNode(cssRule));
        }

        document.head.appendChild(style);

        /*var elems = document.querySelector('.global-nav__primary-items');
        elems.children[elems.children.length - 1].style.visibility = 'hidden';
        elems.children[elems.children.length - 2].style.visibility = 'hidden';*/
    }, 500);
}

/*
console.log("test");
{        
    stylesheet = document.styleSheets[0];

    stylesheet.insertRule("._ab8w._ab94._ab99._ab9f._ab9k._ab9p._abaj._abbz._ab9_._abcm { display: none; }", 0);
    //stylesheet.insertRule("._abm4 { display: none; }", 0);
    stylesheet.insertRule("article._ab6k { display: none !important; }", 0);
}

{
    const s = document.createElement("style");
    document.head.appendChild(s);

    s.sheet.insertRule("#masthead-container { display: none !important; }", 1);
}
*/