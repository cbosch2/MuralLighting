from nicegui import ui # pip install nicegui

selected_cards = [] # global list to control the selected ones

iframe_container = None

def show_selected_images():
    if len(selected_cards) == 2:
        def format_exr(image_name):
            # Get the folder name and file name
            parts = image_name.rsplit('/', 1)  # ['folder', 'file.jpg']
            folder = parts[0]                  # folder
            file_name = parts[1].rsplit('.', 1)[0]  # name without extension
            return f"XII/{folder}/{file_name}.exr"   # new format

        img1 = format_exr(selected_cards[0]["image"])
        img2 = format_exr(selected_cards[1]["image"])
        url = f"http://127.0.0.1:3006/index.html?img1={img1}&img2={img2}"
    else:
        url = "http://127.0.0.1:3006/index.html"

    return f'''
    <div class="w-full h-full">
        <iframe 
            src="{url}" 
            style="width:100%; height:100%; border:none;" 
            allowfullscreen
            loading="lazy">
        </iframe>
    </div>
    '''







def expansion(tabs, panels, text, description=None, classes=""):
    with tabs:
        tab = ui.tab(text)
    with panels:
        exp = ui.tab_panel(tab).classes('w-full justify-center items-center '+classes)
        if description:
            with exp:
                ui.markdown(f"### {description}")
    return exp

def card(image, text, classes, max_selected=2):
    with ui.card().tight().classes(classes) as c:
        with ui.image(image) as img:
            button = ui.button(icon='check_circle') \
                .props('flat fab color=white') \
                .classes('absolute top-0 right-0 m-1')
            button.set_visibility(False)  # hidden by default

            def toggle_selection():
                global selected_cards, iframe_container

                # Find if the card is already selected
                found = next((s for s in selected_cards if s["card"] == c), None)

                if found:
                    # Deselect
                    selected_cards = [s for s in selected_cards if s["card"] != c]
                    button.set_visibility(False)
                else:
                    # Only allow up to max_selected
                    if len(selected_cards) >= max_selected:
                        ui.notify(f'⚠️ You can only select {max_selected}', color='red')
                        return
                    selected_cards.append({"card": c, "image": image, "text": text})
                    button.set_visibility(True)

                # Update iframe
                if iframe_container:
                    iframe_container.set_content(show_selected_images())


            img.on('click', toggle_selection)

        with ui.card_section():
            if isinstance(text, list):
                for t in text:
                    ui.markdown(t)
            else:
                ui.markdown(text)
        
            
NATURAL = "**Natural illumination**: "
NAT_NONE = "**Natural illumination**: no"
ARTIFICIAL = "**Artificial illumination**: "
ART_NONE = "**Artificial illumination**: no"
C1 = "- Hanging oil lamp"
C2 = "- Two table candles"
C3 = "- Two floor chandeliers"
C4 = "- Four floor chandeliers"

D1 = "Dec 25th"
D2 = "Apr 1st"
D3 = "Jun 6th"
DD1 = f"- Date: {D1}"
DD2 = f"- Date: {D2}"   
DD3 = f"- Date: {D3}"
D1T1 = "- Time: 10:00 am"
D1T2 = "- Time: 10:53 am"
D1T3 = "- Time: 12:53 pm"
D2T1 = "- Time: 10:00 am"
D2T2 = "- Time: 10:56 am"
D2T3 = "- Time: 13:56 pm"
D3T1 = "- Time: 10:00 am"
D3T2 = "- Time: 11:53 am"
D3T3 = "- Time: 13:53 pm"


@ui.page('/')
def main():

    global selected_cards
    # Only clear the selected list
    selected_cards = []

    # Hide checks from any existing cards
    for s in selected_cards:
        s["card"].query_selector("button").set_visibility(False)

        
    #ui.dark_mode().enable()
    
    tabs = ui.tabs().classes('w-full')
    panels = ui.tab_panels(tabs).classes('w-full')
    

    with panels:
        with expansion(tabs, panels, "Introduction", 'Anonymous introduction'):
            ui.image('anonymized.webp').classes('w-[800px]')

        with expansion(tabs, panels, "Natural illumination", 'The images below were rendered with **natural daylight**, at different **dates** and **times**:'):
            with ui.column().classes('w-full'):
                classes = "" 
                heading_classes = 'min-w-[160px]'
                
                with ui.row().classes('w-full justify-center items-center'):
                    with ui.card():
                        ui.markdown(f'##### {D2}').classes(heading_classes)
                        with ui.row().classes('w-full'):
                            card("natural/D2T1-pv2.jpg", [NATURAL, DD2, D2T1, ART_NONE], classes)
                            card("natural/D2T2.jpg", [NATURAL, DD2, D2T2, ART_NONE], classes)
                            card("natural/D2T3.jpg", [NATURAL, DD2, D2T3, ART_NONE], classes)

                    with ui.card():
                        ui.markdown(f'##### {D3}').classes(heading_classes)
                        with ui.row().classes('w-full'):
                            card("natural/D3T1.jpg", [NATURAL, DD3, D3T1, ART_NONE], classes)
                            card("natural/D3T2.jpg", [NATURAL, DD3, D3T2, ART_NONE], classes)
                            card("natural/D3T3.jpg", [NATURAL, DD3, D3T3, ART_NONE], classes)

                    with ui.card():
                        ui.markdown(f'##### {D1}').classes(heading_classes)
                        with ui.row().classes('w-full'):
                            card("natural/D1T1.jpg", [NATURAL, DD1, D1T1, ART_NONE], classes)
                            card("natural/D1T2.jpg", [NATURAL, DD1, D1T2, ART_NONE], classes)
                            card("natural/D1T3.jpg", [NATURAL, DD1, D1T3, ART_NONE], classes)

    with expansion(tabs, panels, "Artificial illumination", 'The images below were rendered with **no natural lighting**, with **different layouts** for the **candles** and **oil lamps**:'):
        with ui.column().classes('w-full'):
            with ui.row().classes('w-full justify-center items-center'):
                classes = "min-w-[220px] min-h-[400px]"
                card("artificial/C1pv2R.jpg", [NAT_NONE, ARTIFICIAL, C1], classes)
                card("artificial/C2pv2R.jpg", [NAT_NONE, ARTIFICIAL, C2], classes)
                card("artificial/C3pv2R.jpg", [NAT_NONE, ARTIFICIAL, C3], classes)
                card("artificial/C4pv2R.jpg", [NAT_NONE, ARTIFICIAL, C4], classes)
                card("artificial/C5pv2R.jpg", [NAT_NONE, ARTIFICIAL, C1, C2, C4], classes)


    with expansion(tabs, panels, "Natural and artificial illumination", 'The images below were rendered with **natural lighting** and varying **artificial light sources**:'):
        classes = "min-w-[220px] min-h-[450px]" 
        heading_classes = 'min-w-[160px]'
        
        with ui.row().classes('w-full justify-center'):
            with ui.card():
                ui.markdown(f'##### {D2}').classes(heading_classes)
                with ui.row().classes('w-full'):
                    card("nat&art/D2C2.jpg", [NATURAL, DD2, D2T3, ARTIFICIAL, C2], classes)
                    card("nat&art/D2C5.jpg", [NATURAL, DD2, D2T3, ARTIFICIAL, C1, C2, C4], classes)

            with ui.card():
                ui.markdown(f'##### {D1}').classes(heading_classes)
                with ui.row().classes('w-full'):
                    card("nat&art/D1C2.jpg", [NATURAL, DD1, D1T3, ARTIFICIAL, C2], classes)
                    card("nat&art/D1C5.jpg", [NATURAL, DD1, D1T3, ARTIFICIAL, C1, C2, C4], classes)



    with expansion(tabs, panels, "All combinations", None, "scale-75 origin-top"):
        with ui.card().classes('w-full'):
            ui.markdown('##### Natural illumination')
            classes = "" 
            heading_classes = 'min-w-[160px]'
            
            with ui.row().classes('w-full justify-center items-center'):
                with ui.card():
                    ui.markdown(f'##### {D2}').classes(heading_classes)
                    with ui.row().classes('w-full'):
                        card("natural/D2T1.jpg", [D2T1[2:]], classes)
                        card("natural/D2T2.jpg", [D2T2[2:]], classes)
                        card("natural/D2T3.jpg", [D2T3[2:]], classes)

                with ui.card():
                    ui.markdown(f'##### {D3}').classes(heading_classes)
                    with ui.row().classes('w-full'):
                        card("natural/D3T1.jpg", [D3T1[2:]], classes)
                        card("natural/D3T2.jpg", [D3T2[2:]], classes)
                        card("natural/D3T3.jpg", [D3T3[2:]], classes)

                with ui.card():
                    ui.markdown(f'##### {D1}').classes(heading_classes)
                    with ui.row().classes('w-full'):
                        card("natural/D1T1.jpg", [D1T1[2:]], classes)
                        card("natural/D1T2.jpg", [D1T2[2:]], classes)
                        card("natural/D1T3.jpg", [D1T3[2:]], classes)
    
        with ui.card().classes('w-full'):
            ui.markdown('##### Artificial illumination')
            with ui.row().classes('w-full justify-center items-center'):
                classes = "min-w-[180px] min-h-[300px]"
                card("artificial/C1pv2R.jpg", [C1[2:]], classes)
                card("artificial/C2pv2R.jpg", [C2[2:]], classes)
                card("artificial/C3pv2R.jpg", [C3[2:]], classes)
                card("artificial/C4pv2R.jpg", [C4[2:]], classes)
                card("artificial/C5pv2R.jpg", [C1[2:], C2[2:], C4[2:]], classes)

        with ui.card().classes('w-full'):
            ui.markdown('##### Natural & artificial illumination')
            classes = "min-w-[180px] min-h-[330px]" #min-w-[220px] min-h-[450px]"
            heading_classes = 'min-w-[160px]'
        
            with ui.row().classes('w-full justify-center'):
                with ui.card():
                    ui.markdown(f'##### {D2}').classes(heading_classes)
                    with ui.row().classes('w-full'):
                        card("nat&art/D2C2.jpg", [D2T3[2:], C2[2:]], classes)
                        card("nat&art/D2C5.jpg", [D2T3[2:], C1[2:], C2[2:], C4[2:]], classes)

                with ui.card():
                    ui.markdown(f'##### {D1}').classes(heading_classes)
                    with ui.row().classes('w-full'):
                        card("nat&art/D1C2.jpg", [D1T3[2:], C2[2:]], classes)
                        card("nat&art/D1C5.jpg", [D1T3[2:], C1[2:], C2[2:], C4[2:]], classes)


    with expansion(tabs, panels, "Interactive viewer",""):
        global iframe_container
        iframe_container = ui.html(show_selected_images()).classes('w-full h-[80vh]')
        

        
        



            

ui.run()

