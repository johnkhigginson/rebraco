using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Rebraco.CMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddInquiryEfCoreIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EfPropertyId",
                schema: "rebraco",
                table: "Inquiries",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EfUnitId",
                schema: "rebraco",
                table: "Inquiries",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EfPropertyId",
                schema: "rebraco",
                table: "Inquiries");

            migrationBuilder.DropColumn(
                name: "EfUnitId",
                schema: "rebraco",
                table: "Inquiries");
        }
    }
}
