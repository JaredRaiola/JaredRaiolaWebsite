function rowOfPeople(id, name, bID) {
    return `
        <div class="entry" id="${id}">
            <div class="info">
                <div class="name">${name}</div>
                <br>
            </div>
            <div class="selection">
                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(152,251,152)';
                    setState(${id}, 1);" 
                    id="${id}-1">In</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(135,206,250)';
                    setState(${id}, 2);" 
                    id="${id}-2">Lunch</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(220,20,60)';
                    setState(${id}, 3);" 
                    id="${id}-3">Sick</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(255,182,193)';
                    setState(${id}, 4);" 
                    id="${id}-4">Vacation</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='visible';
                    document.getElementById('${bID}').value='Enter Location Here';
                    backgroundColor('${id}');
                    setState(${id}, 5);" 
                    id="${id}-5">Other</span>

                <input type="text" id="${bID}" style="visibility:hidden" 
                    value="Enter Location Here" onfocus="inputFocus(this)" onblur="inputBlur(this)" />
                </div>
            </div>
        </div>`
}

function rowOfPeopleState1(id, name, bID) {
    return `
        <div class="entry" id="${id}">
            <div class="info">
                <div class="name">${name}</div>
                <br>
            </div>
            <div class="selection">
                <span class="attribute-button selected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(152,251,152)';
                    setState(${id}, 1);" 
                    id="${id}-1">In</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(135,206,250)';
                    setState(${id}, 2);" 
                    id="${id}-2">Lunch</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(220,20,60)';
                    setState(${id}, 3);" 
                    id="${id}-3">Sick</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(255,182,193)';
                    setState(${id}, 4);" 
                    id="${id}-4">Vacation</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='visible';
                    document.getElementById('${bID}').value='Enter Location Here';
                    backgroundColor('${id}');
                    setState(${id}, 5);" 
                    id="${id}-5">Other</span>

                <input type="text" id="${bID}" style="visibility:hidden" 
                    value="Enter Location Here" onfocus="inputFocus(this)" onblur="inputBlur(this)" />
                </div>
            </div>
        </div>`
}

function rowOfPeopleState2(id, name, bID) {
    return `
        <div class="entry" id="${id}">
            <div class="info">
                <div class="name">${name}</div>
                <br>
            </div>
            <div class="selection">
                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(152,251,152)';
                    setState(${id}, 1);" 
                    id="${id}-1">In</span>

                <span class="attribute-button selected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(135,206,250)';
                    setState(${id}, 2);" 
                    id="${id}-2">Lunch</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(220,20,60)';
                    setState(${id}, 3);" 
                    id="${id}-3">Sick</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(255,182,193)';
                    setState(${id}, 4);" 
                    id="${id}-4">Vacation</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='visible';
                    document.getElementById('${bID}').value='Enter Location Here';
                    backgroundColor('${id}');
                    setState(${id}, 5);" 
                    id="${id}-5">Other</span>

                <input type="text" id="${bID}" style="visibility:hidden" 
                    value="Enter Location Here" onfocus="inputFocus(this)" onblur="inputBlur(this)" />
                </div>
            </div>
        </div>`
}

function rowOfPeopleState3(id, name, bID) {
    return `
        <div class="entry" id="${id}">
            <div class="info">
                <div class="name">${name}</div>
                <br>
            </div>
            <div class="selection">
                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(152,251,152)';
                    setState(${id}, 1);" 
                    id="${id}-1">In</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(135,206,250)';
                    setState(${id}, 2);" 
                    id="${id}-2">Lunch</span>

                <span class="attribute-button selected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(220,20,60)';
                    setState(${id}, 3);" 
                    id="${id}-3">Sick</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(255,182,193)';
                    setState(${id}, 4);" 
                    id="${id}-4">Vacation</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='visible';
                    document.getElementById('${bID}').value='Enter Location Here';
                    backgroundColor('${id}');
                    setState(${id}, 5);" 
                    id="${id}-5">Other</span>

                <input type="text" id="${bID}" style="visibility:hidden" 
                    value="Enter Location Here" onfocus="inputFocus(this)" onblur="inputBlur(this)" />
                </div>
            </div>
        </div>`
}

function rowOfPeopleState4(id, name, bID) {
    return `
        <div class="entry" id="${id}">
            <div class="info">
                <div class="name">${name}</div>
                <br>
            </div>
            <div class="selection">
                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(152,251,152)';
                    setState(${id}, 1);" 
                    id="${id}-1">In</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(135,206,250)';
                    setState(${id}, 2);" 
                    id="${id}-2">Lunch</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(220,20,60)';
                    setState(${id}, 3);" 
                    id="${id}-3">Sick</span>

                <span class="attribute-button selected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(255,182,193)';
                    setState(${id}, 4);" 
                    id="${id}-4">Vacation</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='visible';
                    document.getElementById('${bID}').value='Enter Location Here';
                    backgroundColor('${id}');
                    setState(${id}, 5);" 
                    id="${id}-5">Other</span>

                <input type="text" id="${bID}" style="visibility:hidden" 
                    value="Enter Location Here" onfocus="inputFocus(this)" onblur="inputBlur(this)" />
                </div>
            </div>
        </div>`
}

function rowOfPeopleState5(id, name, bID) {
    return `
        <div class="entry" id="${id}">
            <div class="info">
                <div class="name">${name}</div>
                <br>
            </div>
            <div class="selection">
                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(152,251,152)';
                    setState(${id}, 1);" 
                    id="${id}-1">In</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(135,206,250)';
                    setState(${id}, 2);" 
                    id="${id}-2">Lunch</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(220,20,60)';
                    setState(${id}, 3);" 
                    id="${id}-3">Sick</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(255,182,193)';
                    setState(${id}, 4);" 
                    id="${id}-4">Vacation</span>

                <span class="attribute-button selected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='visible';
                    document.getElementById('${bID}').value='Enter Location Here';
                    backgroundColor('${id}');
                    setState(${id}, 5);" 
                    id="${id}-5">Other</span>

                <input type="text" id="${bID}" style="visibility:hidden" 
                    value="Enter Location Here" onfocus="inputFocus(this)" onblur="inputBlur(this)" />
                </div>
            </div>
        </div>`
}
