package capstone.parkingmate;

import capstone.parkingmate.dto.CongestionDTO;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.DocumentBuilder;
import java.util.ArrayList;
import java.util.List;

public class CongestionApiParser {

    private static final String API_KEY = "4a62524852746b7336395852546864";
    private static final String BASE_URL = "http://openapi.seoul.go.kr:8088/" + API_KEY + "/xml/GetParkingInfo";
    private static final int PAGE_SIZE = 1000;

    public static List<CongestionDTO> fetchCongestionData() {
        List<CongestionDTO> result = new ArrayList<>();
        int start = 1;

        try {
            while (true) {
                int end = start + PAGE_SIZE - 1;
                String url = BASE_URL + "/" + start + "/" + end;
                Document doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(url);
                doc.getDocumentElement().normalize();

                NodeList rows = doc.getElementsByTagName("row");
                if (rows.getLength() == 0) break;

                for (int i = 0; i < rows.getLength(); i++) {
                    Element row = (Element) rows.item(i);

                    String name = getTagValue("PKLT_NM", row);
                    String totalStr = getTagValue("TPKCT", row);
                    String nowStr = getTagValue("NOW_PRK_VHCL_CNT", row);

                    if (name != null && totalStr != null && nowStr != null) {
                        int total = Integer.parseInt(totalStr);
                        int now = Integer.parseInt(nowStr);
                        result.add(new CongestionDTO(name.trim(), total, now));
                    }
                }

                start += PAGE_SIZE;
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return result;
    }

    private static String getTagValue(String tag, Element element) {
        NodeList list = element.getElementsByTagName(tag);
        if (list.getLength() > 0 && list.item(0).getFirstChild() != null) {
            return list.item(0).getFirstChild().getNodeValue();
        }
        return null;
    }
}
