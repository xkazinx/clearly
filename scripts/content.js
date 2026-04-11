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
    
    stylesheet = document.styleSheets[0];
    setTimeout(function(){
        stylesheet.insertRule("#mount_0_0_Id > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div > div > div.x78zum5.xdt5ytf.x1t2pt76.x1n2onr6.x1ja2u2z.x10cihs4 > div.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl.x9f619.x16ye13r.xvbhtw8.x78zum5.x15mokao.x1ga7v0g.x16uus16.xbiv7yw.x1uhb9sk.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.x1q0g3np.xqjyukv.x1qjc9v5.x1oa3qoh.x1qughib > div.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl.x9f619.xjbqb8w.x78zum5.x15mokao.x1ga7v0g.x16uus16.xbiv7yw.xixxii4.x13vifvy.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1.x1dr59a3.xeq5yr9.x1n327nk > div > div > div > div > div.x1iyjqo2.xh8yej3 > div:nth-child(4) > span { display: none; }", 0);
        
        const elem = document.querySelectorAll('.x1iyjqo2.xh8yej3');
        console.log(elem);
        elem[0].children[0].style.visibility = 'hidden'; 
        elem[0].children[2].style.visibility = 'hidden'; 
        elem[0].children[3].style.visibility = 'hidden'; 
        elem[0].children[6].style.visibility = 'hidden'; 
        elem[0].children[7].style.visibility = 'hidden'; 
        
        document.querySelector('.x1dr59a3.x13vifvy.x7vhb2i.x6bx242').style.visibility = 'hidden';   
    }, 500);

    // hide
    //html-div xdj266r x14z9mp xat24cr x1lziwak xexx8yu xyri2b x18d9i69 x1c1uobl x9f619 xjbqb8w x78zum5 x15mokao x1ga7v0g x16uus16 xbiv7yw x1plvlek xryxfnj x1c4vz4f x2lah0s xdt5ytf xqjyukv x1qjc9v5 x1oa3qoh x1nhvcw1 x3h4tne x145d82y xixxii4
}
else if(Is("discord.com", false))
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
        document.querySelector(".scaffold-layout__sidebar")
            .style.visibility = 'hidden';

        // Hide right panel
        document.querySelector(".scaffold-layout__aside")
            .style.visibility = 'hidden';
    
        
        // Add blank space between posts
        const style = document.createElement('style');
        style.type = 'text/css';

        const cssRule = `.update-components-header, .update-components-actor--with-control-menu-and-hide-post{
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

        var elems = document.querySelector('.global-nav__primary-items');
        elems.children[elems.children.length - 1].style.visibility = 'hidden';
        elems.children[elems.children.length - 2].style.visibility = 'hidden';
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