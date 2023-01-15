import "chromedriver"
import assert from "assert"
import webdriver from "selenium-webdriver"
import getPort from "get-port"
import forEach from "mocha-each"

import {server} from "./server.mjs"

const port = await getPort({port: 3000})

const driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build()
const manage = driver.manage()
manage.window().maximize()
let demoUrls
server.listen(port)
await driver.get(`http://localhost:${port}`).then(
    () => driver.findElements(webdriver.By.css("a"))
).then(
    nodes => Promise.all(nodes.map(node => node.getAttribute("href")))
).then(
    urls => {
        demoUrls = urls
    }
)


const clickAllSortableHeaders = function(driver, counter=0) {
    // Click each sort header. But query the list of all headers again after
    // each click as the dom nodes may have been changed out.
    return driver.findElements(webdriver.By.css("th[data-sortable=true]")).then(
        nodes => {
            if ((nodes.length-1) < counter) {
                return Promise.resolve()
            }
            return nodes[counter].click().then(
                () => driver.sleep(100)
            ).then(
                () => {
                    counter += 1
                    return clickAllSortableHeaders(driver, counter)
                }
            )
        }
    )
}


describe("Demos work", function() {
    this.timeout(5000)
    forEach(demoUrls).it("loads %s without JS errors", url => driver.get(url).then(
        () => manage.logs().get("browser")
    ).then(
        log => assert.deepEqual(log, [])
    ))

    forEach(demoUrls).it("can click on all sort headers of %s without JS errors", url => driver.get(url).then(
        () => clickAllSortableHeaders(driver)
    ).then(
        () => manage.logs().get("browser")
    ).then(
        log => assert.deepEqual(log, [])
    ))
})

after(() => {
    driver.quit()
    server.close()
})
